import time
from typing import List, Dict, Any, Optional
from src.config.sqlserver import sqlserver_cursor
from src.config.mysql import mysql_cursor
import logging

logger = logging.getLogger(__name__)

class IntegrationRepository:
    # ---------- HR (SQL Server) ----------
    @staticmethod
    def _rows_to_dict(cursor, rows):
        """Chuyển đổi list rows từ pyodbc thành list dict"""
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in rows]

    @staticmethod
    def get_hr_employees() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("""
                SELECT EmployeeID, FullName, DepartmentID, PositionID, Status, Email, HireDate
                FROM Employees
            """)
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    @staticmethod
    def get_hr_departments() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments")
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    @staticmethod
    def get_hr_positions() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("SELECT PositionID, PositionName FROM Positions")
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    # ---------- Payroll (MySQL) – vẫn giữ nguyên vì dùng DictCursor ----------
    @staticmethod
    def get_payroll_employees() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT EmployeeID, FullName, DepartmentID, PositionID, Status
                FROM employees_payroll
            """)
            return cursor.fetchall()

    @staticmethod
    def get_payroll_departments() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("SELECT DepartmentID, DepartmentName FROM departments_payroll")
            return cursor.fetchall()

    @staticmethod
    def get_payroll_positions() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("SELECT PositionID, PositionName FROM positions_payroll")
            return cursor.fetchall()

    # ---------- Update Payroll from HR ----------
    @staticmethod
    def upsert_payroll_employee(emp: Dict[str, Any]) -> None:
        with mysql_cursor() as cursor:
            cursor.execute("""
                INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status, SyncedAt)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    FullName = VALUES(FullName),
                    DepartmentID = VALUES(DepartmentID),
                    PositionID = VALUES(PositionID),
                    Status = VALUES(Status),
                    SyncedAt = NOW()
            """, (emp["EmployeeID"], emp["FullName"], emp["DepartmentID"],
                  emp["PositionID"], emp["Status"]))

    @staticmethod
    def upsert_payroll_department(dept: Dict[str, Any]) -> None:
        with mysql_cursor() as cursor:
            cursor.execute("""
                INSERT INTO departments_payroll (DepartmentID, DepartmentName, SyncedAt)
                VALUES (%s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    DepartmentName = VALUES(DepartmentName),
                    SyncedAt = NOW()
            """, (dept["DepartmentID"], dept["DepartmentName"]))

    @staticmethod
    def upsert_payroll_position(pos: Dict[str, Any]) -> None:
        with mysql_cursor() as cursor:
            cursor.execute("""
                INSERT INTO positions_payroll (PositionID, PositionName, SyncedAt)
                VALUES (%s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    PositionName = VALUES(PositionName),
                    SyncedAt = NOW()
            """, (pos["PositionID"], pos["PositionName"]))

    # ---------- Connection test ----------
    @staticmethod
    def test_sqlserver_connection() -> tuple[bool, Optional[int], Optional[str]]:
        try:
            start = time.time()
            with sqlserver_cursor() as cursor:
                cursor.execute("SELECT 1")
            latency = int((time.time() - start) * 1000)
            return True, latency, None
        except Exception as e:
            return False, None, str(e)

    @staticmethod
    def test_mysql_connection() -> tuple[bool, Optional[int], Optional[str]]:
        try:
            start = time.time()
            with mysql_cursor() as cursor:
                cursor.execute("SELECT 1")
            latency = int((time.time() - start) * 1000)
            return True, latency, None
        except Exception as e:
            return False, None, str(e)
        
        # Thêm vào cuối class IntegrationRepository

    @staticmethod
    def get_hr_employees_with_details() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("""
                SELECT e.EmployeeID, e.FullName, e.DepartmentID, d.DepartmentName, 
                    e.PositionID, p.PositionName, e.Status, e.Email, e.HireDate
                FROM Employees e
                LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
                LEFT JOIN Positions p ON e.PositionID = p.PositionID
            """)
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    @staticmethod
    def get_payroll_employees_with_details() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT ep.EmployeeID, ep.FullName, ep.DepartmentID, dp.DepartmentName,
                    ep.PositionID, pp.PositionName, ep.Status
                FROM employees_payroll ep
                LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
                LEFT JOIN positions_payroll pp ON ep.PositionID = pp.PositionID
            """)
            return cursor.fetchall()

    @staticmethod
    def get_hr_departments_with_details() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments")
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    @staticmethod
    def get_payroll_departments_with_details() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("SELECT DepartmentID, DepartmentName FROM departments_payroll")
            return cursor.fetchall()

    @staticmethod
    def get_hr_positions_with_details() -> List[Dict[str, Any]]:
        with sqlserver_cursor() as cursor:
            cursor.execute("SELECT PositionID, PositionName FROM Positions")
            rows = cursor.fetchall()
            return IntegrationRepository._rows_to_dict(cursor, rows)

    @staticmethod
    def get_payroll_positions_with_details() -> List[Dict[str, Any]]:
        with mysql_cursor() as cursor:
            cursor.execute("SELECT PositionID, PositionName FROM positions_payroll")
            return cursor.fetchall()