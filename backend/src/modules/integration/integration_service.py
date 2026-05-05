# backend/src/modules/integration/integration_service.py
import sqlite3
import os
from datetime import datetime
from typing import List, Dict
from .integration_repository import IntegrationRepository as repo
import logging

logger = logging.getLogger(__name__)

DB_PATH = "dashboard.db"  # SQLite cho log và auth (nếu cần)

def init_dashboard_db():
    """Tạo bảng sync_logs nếu chưa tồn tại"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sync_type TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def add_sync_log(sync_type: str, status: str, message: str, details: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sync_logs (sync_type, status, message, details) VALUES (?, ?, ?, ?)",
        (sync_type, status, message, details)
    )
    conn.commit()
    conn.close()

def get_recent_sync_logs(limit: int = 50) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT ?", (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

class IntegrationService:
    @staticmethod
    def get_connection_status():
        sql_ok, sql_lat, sql_err = repo.test_sqlserver_connection()
        mysql_ok, mysql_lat, mysql_err = repo.test_mysql_connection()
        return {
            "sqlserver": {
                "status": "connected" if sql_ok else "failed",
                "latency_ms": sql_lat,
                "error": sql_err
            },
            "mysql": {
                "status": "connected" if mysql_ok else "failed",
                "latency_ms": mysql_lat,
                "error": mysql_err
            }
        }

    @staticmethod
    def sync_departments():
        try:
            hr_depts = {d["DepartmentID"]: d["DepartmentName"] for d in repo.get_hr_departments()}
            payroll_depts = {d["DepartmentID"]: d["DepartmentName"] for d in repo.get_payroll_departments()}

            # Cập nhật hoặc thêm mới vào payroll
            for dept_id, name in hr_depts.items():
                repo.upsert_payroll_department({"DepartmentID": dept_id, "DepartmentName": name})

            # (Tùy chọn) Xóa phòng ban không còn trong HR? Theo constraint không nên xóa vì có thể liên quan bảng lương.
            # Ở đây chỉ đồng bộ một chiều.
            add_sync_log("departments", "success", f"Đã đồng bộ {len(hr_depts)} phòng ban.")
            return True, f"Đã đồng bộ {len(hr_depts)} phòng ban."
        except Exception as e:
            add_sync_log("departments", "failed", str(e))
            return False, str(e)

    @staticmethod
    def sync_positions():
        try:
            hr_positions = {p["PositionID"]: p["PositionName"] for p in repo.get_hr_positions()}
            for pos_id, name in hr_positions.items():
                repo.upsert_payroll_position({"PositionID": pos_id, "PositionName": name})
            add_sync_log("positions", "success", f"Đã đồng bộ {len(hr_positions)} chức vụ.")
            return True, f"Đã đồng bộ {len(hr_positions)} chức vụ."
        except Exception as e:
            add_sync_log("positions", "failed", str(e))
            return False, str(e)

    @staticmethod
    def sync_employees():
        try:
            hr_emps = {e["EmployeeID"]: e for e in repo.get_hr_employees()}
            payroll_emps = {e["EmployeeID"]: e for e in repo.get_payroll_employees()}
            updated = 0
            for emp_id, hr_emp in hr_emps.items():
                # Luôn cập nhật từ HR sang Payroll nếu có thay đổi hoặc chưa tồn tại
                repo.upsert_payroll_employee(hr_emp)
                updated += 1
            add_sync_log("employees", "success", f"Đã đồng bộ {updated} nhân viên.")
            return True, f"Đã đồng bộ {updated} nhân viên."
        except Exception as e:
            add_sync_log("employees", "failed", str(e))
            return False, str(e)

    @staticmethod
    def sync_all():
        results = []
        all_ok = True
        for sync_func in [IntegrationService.sync_departments,
                          IntegrationService.sync_positions,
                          IntegrationService.sync_employees]:
            ok, msg = sync_func()
            results.append(msg)
            if not ok:
                all_ok = False
        add_sync_log("full", "success" if all_ok else "partial", "; ".join(results))
        return all_ok, results
    # Thêm vào class IntegrationService

    @staticmethod
    def get_employee_comparison():
        hr_employees = repo.get_hr_employees_with_details()
        payroll_employees = repo.get_payroll_employees_with_details()
        hr_map = {e["EmployeeID"]: e for e in hr_employees}
        payroll_map = {e["EmployeeID"]: e for e in payroll_employees}
        comparison = []
        for emp_id, hr_emp in hr_map.items():
            pay_emp = payroll_map.get(emp_id)
            status = "synced" if pay_emp else "missing"
            if pay_emp and (hr_emp["FullName"] != pay_emp["FullName"] or
                            hr_emp["DepartmentID"] != pay_emp["DepartmentID"] or
                            hr_emp["PositionID"] != pay_emp["PositionID"] or
                            hr_emp["Status"] != pay_emp["Status"]):
                status = "mismatch"
            comparison.append({
                "id": emp_id,
                "hr_data": hr_emp,
                "payroll_data": pay_emp,
                "status": status
            })
        return comparison

    @staticmethod
    def get_department_comparison():
        hr_depts = repo.get_hr_departments_with_details()
        payroll_depts = repo.get_payroll_departments_with_details()
        hr_map = {d["DepartmentID"]: d for d in hr_depts}
        payroll_map = {d["DepartmentID"]: d for d in payroll_depts}
        comparison = []
        for dept_id, hr_dept in hr_map.items():
            pay_dept = payroll_map.get(dept_id)
            status = "synced" if pay_dept else "missing"
            if pay_dept and hr_dept["DepartmentName"] != pay_dept["DepartmentName"]:
                status = "mismatch"
            comparison.append({
                "id": dept_id,
                "hr_data": hr_dept,
                "payroll_data": pay_dept,
                "status": status
            })
        return comparison

    @staticmethod
    def get_position_comparison():
        hr_pos = repo.get_hr_positions_with_details()
        payroll_pos = repo.get_payroll_positions_with_details()
        hr_map = {p["PositionID"]: p for p in hr_pos}
        payroll_map = {p["PositionID"]: p for p in payroll_pos}
        comparison = []
        for pos_id, hr_pos_item in hr_map.items():
            pay_pos = payroll_map.get(pos_id)
            status = "synced" if pay_pos else "missing"
            if pay_pos and hr_pos_item["PositionName"] != pay_pos["PositionName"]:
                status = "mismatch"
            comparison.append({
                "id": pos_id,
                "hr_data": hr_pos_item,
                "payroll_data": pay_pos,
                "status": status
            })
        return comparison

    @staticmethod
    def get_sync_stats_24h():
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
            FROM sync_logs
            WHERE created_at >= datetime('now', '-1 day')
        """)
        row = cursor.fetchone()
        conn.close()
        return {
            "success": row[0] or 0,
            "failed": row[1] or 0,
            "partial": row[2] or 0,
            "pending": row[3] or 0
        }
    
    @staticmethod
    def sync_single_employee(emp_id: int):
        try:
            hr_emp = None
            hr_emps = repo.get_hr_employees()
            for emp in hr_emps:
                if emp["EmployeeID"] == emp_id:
                    hr_emp = emp
                    break
            if not hr_emp:
                return False, "Không tìm thấy nhân viên trong HR."
            repo.upsert_payroll_employee(hr_emp)
            add_sync_log("employees", "success", f"Đã đồng bộ nhân viên ID {emp_id}")
            return True, f"Đồng bộ thành công nhân viên {hr_emp['FullName']}."
        except Exception as e:
            add_sync_log("employees", "failed", str(e))
            return False, str(e)