from datetime import datetime
from typing import Any, Dict, List

from src.config.payroll_mysql import get_mysql_connection
from src.config.HUMAN_sqlserver import get_sqlserver_connection
from src.modules.Dashboard.dashboard_schema import DashboardStats, DashboardSummaryResponse
from src.config.auth_db import get_auth_connection

def _fetch_all_auth(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()
    finally:
        conn.close()


def _fetch_one_auth(query: str, params: tuple = ()) -> Dict[str, Any]:
    rows = _fetch_all_auth(query, params)
    return rows[0] if rows else {}

def _fetch_all_sqlserver(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def _fetch_one_sqlserver(query: str, params: tuple = ()) -> Dict[str, Any]:
    rows = _fetch_all_sqlserver(query, params)
    return rows[0] if rows else {}


def _fetch_all_mysql(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        conn.close()


def _fetch_one_mysql(query: str, params: tuple = ()) -> Dict[str, Any]:
    rows = _fetch_all_mysql(query, params)
    return rows[0] if rows else {}


class DashboardService:
    @staticmethod
    def get_dashboard_summary(month: int | None = None, year: int | None = None) -> DashboardSummaryResponse:
        now = datetime.now()
        target_month = month or now.month
        target_year = year or now.year

        hr_stats = _fetch_one_sqlserver(
            """
            SELECT
                COUNT(*) AS total_employees,
                SUM(CASE WHEN LTRIM(RTRIM(ISNULL(Status, ''))) IN (N'Đang làm việc', N'Nghỉ phép', N'Active') THEN 1 ELSE 0 END) AS active_employees,
                SUM(CASE WHEN MONTH(HireDate) = ? AND YEAR(HireDate) = ? THEN 1 ELSE 0 END) AS new_hires
            FROM Employees
            """,
            (target_month, target_year),
        )

        departments = _fetch_all_sqlserver(
            """
            SELECT d.DepartmentID, d.DepartmentName, COUNT(e.EmployeeID) AS EmployeeCount
            FROM Departments d
            LEFT JOIN Employees e ON e.DepartmentID = d.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName
            ORDER BY d.DepartmentID
            """
        )
        total_employees = int(hr_stats.get("total_employees") or 0)
        departments_data = [
            [
                row.get("DepartmentName") or "Chưa phân bổ",
                int((int(row.get("EmployeeCount") or 0) / total_employees) * 100) if total_employees else 0,
                int(row.get("EmployeeCount") or 0),
            ]
            for row in departments
        ]
        dept_map = {row["DepartmentID"]: row.get("DepartmentName") for row in departments}

        employees = _fetch_all_sqlserver(
            """
            SELECT EmployeeID, FullName, DateOfBirth, Gender, Email, PhoneNumber, HireDate, DepartmentID, PositionID, Status
            FROM Employees
            ORDER BY EmployeeID
            """
        )
        positions = _fetch_all_sqlserver("SELECT PositionID, PositionName FROM Positions")
        position_map = {row["PositionID"]: row.get("PositionName") for row in positions}

        attendance_stats = _fetch_one_mysql(
            """
            SELECT
                COALESCE(SUM(WorkDays), 0) AS work_days,
                COALESCE(SUM(LeaveDays), 0) AS leave_days,
                COALESCE(SUM(AbsentDays), 0) AS absent_days
            FROM attendance
            WHERE MONTH(AttendanceMonth) = %s AND YEAR(AttendanceMonth) = %s
            """,
            (target_month, target_year),
        )

        salary_rows = _fetch_all_mysql(
            """
            SELECT EmployeeID, BaseSalary, NetSalary
            FROM salaries
            WHERE MONTH(SalaryMonth) = %s AND YEAR(SalaryMonth) = %s
            """,
            (target_month, target_year),
        )
        salary_map = {row["EmployeeID"]: row for row in salary_rows}
        total_payroll = sum(float(row.get("NetSalary") or 0) for row in salary_rows)

        payroll_rows = []
        for emp in employees:
            salary = salary_map.get(emp.get("EmployeeID"), {})
            dob = emp.get("DateOfBirth")
            payroll_rows.append(
                {
                    "id": emp.get("EmployeeID"),
                    "name": emp.get("FullName") or "N/A",
                    "dob": dob.strftime("%Y-%m-%d") if hasattr(dob, "strftime") else (str(dob) if dob else "---"),
                    "gender": emp.get("Gender") or "---",
                    "dept": dept_map.get(emp.get("DepartmentID"), "---"),
                    "pos": position_map.get(emp.get("PositionID"), "---"),
                    "salary": float(salary.get("BaseSalary") or 0),
                    "status": "approved" if float(salary.get("NetSalary") or 0) > 0 else "pending",
                    "email": emp.get("Email"),
                    "phone": emp.get("PhoneNumber"),
                }
            )

        trend_records = _fetch_all_mysql(
            """
            SELECT DATE_FORMAT(SalaryMonth, '%%Y-%%m') AS month, COALESCE(SUM(NetSalary), 0) AS total
            FROM salaries
            WHERE YEAR(SalaryMonth) = %s
            GROUP BY DATE_FORMAT(SalaryMonth, '%%Y-%%m')
            ORDER BY month DESC
            LIMIT 6
            """,
            (target_year,),
        )
        salary_trend = [
            {"month": row["month"], "total": float(row.get("total") or 0)}
            for row in reversed(trend_records)
        ]
        notification_stats = _fetch_one_auth(
            """
            SELECT COUNT(*) AS open_alerts
            FROM notifications
            WHERE Status = 'OPEN'
              AND IsRead = 0
            """
        )

        open_alerts = int(notification_stats.get("open_alerts") or 0)

        return DashboardSummaryResponse(
            stats=DashboardStats(
                totalEmployees=total_employees,
                fullTimeEmployees=int(hr_stats.get("active_employees") or 0),
                totalDepartments=len(departments),
                totalPositions=len(positions),
                monthlyPayroll=f"{total_payroll:,.0f} VND",
                leaveDays=int(attendance_stats.get("leave_days") or 0),
                workDays=int(attendance_stats.get("work_days") or 0),
                absentDays=int(attendance_stats.get("absent_days") or 0),
                alerts=open_alerts,
            ),
            departmentsData=departments_data,
            recentActivities=[
                f"Dashboard cập nhật dữ liệu cho tháng {target_month}/{target_year}",
                f"Nhân viên mới trong tháng: {int(hr_stats.get('new_hires') or 0)}",
            ],
            payrollRows=payroll_rows,
            salaryTrend=salary_trend,
        )