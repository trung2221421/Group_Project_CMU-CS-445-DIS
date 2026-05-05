import logging
from datetime import date, datetime
from typing import Any, Dict, List, Sequence, Tuple

from src.modules.Reports.reports_schema import (
    AnalysisText,
    DepartmentDataItem,
    DividendRow,
    MonthlyReportResponse,
    ReportStats,
    SalaryTrendItem,
    TopAbsentEmployee,
)
from src.config.payroll_mysql import mysql_cursor
from src.config.HUMAN_sqlserver import sqlserver_cursor

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = (
    "Đang làm việc",
    "Dang lam viec",
    "Active",
    "active",
    "Thử việc",
    "Thu viec",
    "Thực tập",
    "Thuc tap",
    "Nghỉ phép",
    "Nghi phep",
)

def _fetchone_value(row: Any, index: int = 0, default: Any = 0) -> Any:
    if row is None:
        return default
    try:
        value = row[index]
    except (IndexError, KeyError, TypeError):
        value = getattr(row, str(index), default)
    return default if value is None else value

def _to_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0

def _to_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0

def _format_date(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    return str(value)

def _format_money(value: float) -> str:
    return f"{value:,.0f} VND" if value else "0 VND"

def _execute_sqlserver(cursor: Any, query: str, params: Sequence[Any] = ()) -> Any:
    try:
        return cursor.execute(query, tuple(params)) if params else cursor.execute(query)
    except Exception:
        if "?" not in query:
            raise
        fallback_query = query.replace("?", "%s")
        return cursor.execute(fallback_query, tuple(params))

def _active_status_filter(alias: str = "e") -> str:
    placeholders = ", ".join("?" for _ in ACTIVE_STATUSES)
    return f"({alias}.Status IS NULL OR {alias}.Status IN ({placeholders}))"

def _active_status_params() -> Tuple[str, ...]:
    return ACTIVE_STATUSES

def get_employee_stats() -> Tuple[int, int, int]:
    try:
        with sqlserver_cursor() as cursor:
            status_filter = _active_status_filter("e")
            params = _active_status_params()
            _execute_sqlserver(cursor, f"SELECT COUNT(e.EmployeeID) FROM Employees e WHERE {status_filter}", params)
            total_employees = _to_int(_fetchone_value(cursor.fetchone()))
            _execute_sqlserver(cursor, f"SELECT COUNT(e.EmployeeID) FROM Employees e WHERE {status_filter} AND (e.Gender IN (N'Nam', N'Male', N'Nam giới') OR e.Gender LIKE N'%Nam%')", params)
            male_count = _to_int(_fetchone_value(cursor.fetchone()))
            _execute_sqlserver(cursor, f"SELECT COUNT(e.EmployeeID) FROM Employees e WHERE {status_filter} AND (e.Gender IN (N'Nữ', N'Nu', N'Female') OR e.Gender LIKE N'%Nữ%')", params)
            female_count = _to_int(_fetchone_value(cursor.fetchone()))
            return total_employees, male_count, female_count
    except Exception as exc:
        logger.error("Error getting employee stats: %s", exc, exc_info=True)
        return 0, 0, 0

def get_department_data() -> List[DepartmentDataItem]:
    items = []
    try:
        with sqlserver_cursor() as cursor:
            cursor.execute("""
                SELECT ISNULL(d.DepartmentName, N'Chưa phân bổ'), COUNT(e.EmployeeID)
                FROM Departments d
                LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID
                GROUP BY d.DepartmentName
                ORDER BY 2 DESC
            """)
            for row in cursor.fetchall():
                items.append(DepartmentDataItem(name=row[0], value=_to_int(row[1])))
    except Exception as e:
        logger.error(f"Department data error: {e}")
    return items

def get_payroll_stats(month: int, year: int) -> Tuple[float, float]:
    try:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT COALESCE(SUM(NetSalary), 0) AS total_salary,
                       COALESCE(AVG(NetSalary), 0) AS average_salary
                FROM salaries
                WHERE MONTH(SalaryMonth) = %s AND YEAR(SalaryMonth) = %s
            """, (month, year))
            row = cursor.fetchone()
            if row:
                return _to_float(row['total_salary']), _to_float(row['average_salary'])
            return 0.0, 0.0
    except Exception as exc:
        logger.error("Error getting payroll stats: %s", exc, exc_info=True)
        return 0.0, 0.0

def get_attendance_stats(month: int, year: int) -> Tuple[int, int, int]:
    try:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT COALESCE(SUM(WorkDays), 0) AS work_days,
                       COALESCE(SUM(LeaveDays), 0) AS leave_days,
                       COALESCE(SUM(AbsentDays), 0) AS absent_days
                FROM attendance
                WHERE MONTH(AttendanceMonth) = %s AND YEAR(AttendanceMonth) = %s
            """, (month, year))
            row = cursor.fetchone()
            if row:
                return _to_int(row['work_days']), _to_int(row['leave_days']), _to_int(row['absent_days'])
            return 0, 0, 0
    except Exception as exc:
        logger.error("Error getting attendance stats: %s", exc, exc_info=True)
        return 0, 0, 0

def get_salary_trend(year: int) -> List[SalaryTrendItem]:
    totals_by_month = {m: 0.0 for m in range(1,13)}
    try:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT MONTH(SalaryMonth) AS salary_month, COALESCE(SUM(NetSalary), 0) AS total_salary
                FROM salaries
                WHERE YEAR(SalaryMonth) = %s
                GROUP BY salary_month
            """, (year,))
            for row in cursor.fetchall():
                month_num = _to_int(row['salary_month'])
                amount = _to_float(row['total_salary'])
                totals_by_month[month_num] = amount
    except Exception as exc:
        logger.error("Error getting salary trend: %s", exc, exc_info=True)
    return [
        SalaryTrendItem(month=m, label=f"T{m:02d}/{str(year)[-2:]}", value=v, amount=v, total=v, payroll=v)
        for m, v in totals_by_month.items() if v > 0
    ]

def get_payroll_rows(month: int, year: int) -> List[Dict[str, Any]]:
    rows = []
    try:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT
                    s.EmployeeID,
                    COALESCE(ep.FullName, CONCAT('NV_', s.EmployeeID)) AS FullName,
                    COALESCE(dp.DepartmentName, 'Chưa phân bổ') AS DepartmentName,
                    COALESCE(s.BaseSalary, 0) AS BaseSalary,
                    COALESCE(s.Bonus, 0) AS Bonus,
                    COALESCE(s.Deductions, 0) AS Deductions,
                    COALESCE(s.NetSalary, 0) AS NetSalary,
                    COALESCE(a.WorkDays, 0) AS WorkDays,
                    COALESCE(a.LeaveDays, 0) AS LeaveDays,
                    COALESCE(a.AbsentDays, 0) AS AbsentDays,
                    COALESCE(ep.Status, '') AS EmployeeStatus
                FROM salaries s
                LEFT JOIN employees_payroll ep ON ep.EmployeeID = s.EmployeeID
                LEFT JOIN departments_payroll dp ON dp.DepartmentID = ep.DepartmentID
                LEFT JOIN attendance a ON a.EmployeeID = s.EmployeeID
                    AND MONTH(a.AttendanceMonth) = %s AND YEAR(a.AttendanceMonth) = %s
                WHERE MONTH(s.SalaryMonth) = %s AND YEAR(s.SalaryMonth) = %s
                ORDER BY s.EmployeeID ASC
            """, (month, year, month, year))
            for row in cursor.fetchall():
                net = _to_float(row['NetSalary'])
                base = _to_float(row['BaseSalary'])
                bonus = _to_float(row['Bonus'])
                deduct = _to_float(row['Deductions'])
                work = _to_int(row['WorkDays'])
                leave = _to_int(row['LeaveDays'])
                absent = _to_int(row['AbsentDays'])
                status = "Đã duyệt" if net > 0 else ("Chờ xử lý" if (base > 0 or bonus > 0 or deduct > 0) else (row['EmployeeStatus'] or "Chờ xử lý"))
                rows.append({
                    "id": str(row['EmployeeID']),
                    "name": row['FullName'] or f"NV_{row['EmployeeID']}",
                    "dept": row['DepartmentName'] or "Chưa phân bổ",
                    "baseSalary": base,
                    "bonus": bonus,
                    "deductions": deduct,
                    "salary": net,
                    "workDays": work,
                    "leaveDays": leave,
                    "absentDays": absent,
                    "status": status,
                })
    except Exception as exc:
        logger.error("Error getting payroll rows: %s", exc, exc_info=True)
    return rows

def get_top_absent_employees(month: int, year: int) -> List[TopAbsentEmployee]:
    items = []
    try:
        with mysql_cursor() as cursor:
            cursor.execute("""
                SELECT
                    a.EmployeeID,
                    COALESCE(ep.FullName, CONCAT('NV_', a.EmployeeID)) AS FullName,
                    COALESCE(dp.DepartmentName, 'Chưa phân bổ') AS DepartmentName,
                    COALESCE(SUM(a.AbsentDays), 0) AS absent_count
                FROM attendance a
                LEFT JOIN employees_payroll ep ON ep.EmployeeID = a.EmployeeID
                LEFT JOIN departments_payroll dp ON dp.DepartmentID = ep.DepartmentID
                WHERE MONTH(a.AttendanceMonth) = %s AND YEAR(a.AttendanceMonth) = %s
                GROUP BY a.EmployeeID, ep.FullName, dp.DepartmentName
                HAVING absent_count > 0
                ORDER BY absent_count DESC, a.EmployeeID ASC
            """, (month, year))
            for row in cursor.fetchall():
                cnt = _to_int(row['absent_count'])
                reason = (
                    "Cảnh báo: Vắng mặt quá nhiều" if cnt >= 10
                    else ("Nhắc nhở: Vắng mặt thường xuyên" if cnt >= 5
                    else "Cần theo dõi thêm")
                )
                items.append(TopAbsentEmployee(
                    id=str(row['EmployeeID']),
                    name=row['FullName'] or f"NV_{row['EmployeeID']}",
                    dept=row['DepartmentName'] or "Chưa phân bổ",
                    absentCount=cnt,
                    reason=reason,
                    note=reason,
                ))
    except Exception as exc:
        logger.error("Error getting top absent employees: %s", exc, exc_info=True)
    return items

def get_dividends_data(month: int, year: int) -> List[DividendRow]:
    items = []
    try:
        with sqlserver_cursor() as cursor:
            _execute_sqlserver(cursor, """
                SELECT dv.EmployeeID, e.FullName, ISNULL(d.DepartmentName, N'Chưa phân bổ') AS DepartmentName,
                       dv.DividendAmount, dv.DividendDate
                FROM Dividends dv
                LEFT JOIN Employees e ON e.EmployeeID = dv.EmployeeID
                LEFT JOIN Departments d ON d.DepartmentID = e.DepartmentID
                WHERE MONTH(dv.DividendDate) = ? AND YEAR(dv.DividendDate) = ?
                ORDER BY dv.DividendDate DESC, dv.EmployeeID ASC
            """, (month, year))
            for row in cursor.fetchall():
                items.append(DividendRow(
                    id=str(row[0]),
                    name=row[1] or f"NV_{row[0]}",
                    dept=row[2] or "Chưa phân bổ",
                    amount=_to_float(row[3]),
                    date=_format_date(row[4])
                ))
    except Exception as exc:
        logger.error("Error getting dividends data: %s", exc, exc_info=True)
    return items

def generate_analysis_texts(total_employees, male_count, female_count, total_payroll, average_salary, work_days, leave_days, absent_days, dividends_count, total_dividends, month, year):
    male_percent = (male_count / total_employees * 100) if total_employees else 0
    female_percent = (female_count / total_employees * 100) if total_employees else 0
    employee_text = (
        f"Kỳ báo cáo tháng {month}/{year}: tổng số {total_employees} nhân sự, "
        f"nam {male_count} ({male_percent:.1f}%), nữ {female_count} ({female_percent:.1f}%). "
        + ("Cơ cấu cân bằng." if abs(male_percent - female_percent) <= 15
           else ("Nam chiếm ưu thế." if male_percent > female_percent else "Nữ chiếm ưu thế."))
    )
    salary_text = (
        f"Tổng quỹ lương: {_format_money(total_payroll)}. Bình quân: {_format_money(average_salary)}. "
        + ("Mức cạnh tranh." if average_salary >= 15000000
           else ("Trung bình khá." if average_salary >= 10000000 else "Cần xem xét chính sách lương."))
    )
    total_att = work_days + leave_days + absent_days
    rate = (work_days / total_att * 100) if total_att else 0
    attendance_text = (
        f"Chấm công: {work_days} công, {leave_days} nghỉ, {absent_days} vắng. "
        f"Tỷ lệ chuyên cần {rate:.1f}%. "
        + ("Rất tốt." if rate >= 95 else ("Đạt yêu cầu." if rate >= 85 else "Cần cải thiện."))
    )
    dividend_text = (
        f"Chi trả cổ tức cho {dividends_count} nhân sự, tổng {_format_money(total_dividends)}. "
        + (f"Bình quân {_format_money(total_dividends / dividends_count)}/người." if dividends_count else "")
    )
    return AnalysisText(
        salaryText=salary_text,
        attendanceText=attendance_text,
        employeeText=employee_text,
        dividendText=dividend_text
    )

def get_monthly_report(month: int, year: int) -> MonthlyReportResponse:
    logger.info("Fetching monthly report for %s/%s", month, year)
    total_employees, male_count, female_count = get_employee_stats()
    total_payroll, average_salary = get_payroll_stats(month, year)
    work_days, leave_days, absent_days = get_attendance_stats(month, year)
    department_data = get_department_data()
    salary_trend = get_salary_trend(year)
    payroll_rows = get_payroll_rows(month, year)
    top_absent = get_top_absent_employees(month, year)
    dividends = get_dividends_data(month, year)
    total_dividends = sum(d.amount for d in dividends)
    analysis = generate_analysis_texts(
        total_employees, male_count, female_count, total_payroll, average_salary,
        work_days, leave_days, absent_days, len(dividends), total_dividends, month, year
    )
    return MonthlyReportResponse(
        month=month, year=year,
        stats=ReportStats(
            monthlyPayroll=_format_money(total_payroll),
            workDays=work_days,
            leaveDays=leave_days,
            absentDays=absent_days,
            totalEmployees=total_employees,
            maleCount=male_count,
            femaleCount=female_count,
            totalSalary=total_payroll,
            averageSalary=average_salary
        ),
        topAbsentEmployees=top_absent,
        salaryTrend=salary_trend,
        payrollRows=payroll_rows,
        departmentData=department_data,
        dividendsData=dividends,
        analysis=analysis
    )