from calendar import monthrange
from datetime import date, datetime, timedelta

from src.config.payroll_mysql import get_mysql_connection
from src.config.HUMAN_sqlserver import get_sqlserver_connection

from src.modules.notifications.notification_repository import (
    create_notification,
    list_notifications,
    mark_all_notifications_read,
    notification_exists,
)


LEAVE_LIMIT_DAYS = 5
ABSENCE_MEDIUM_DAYS = 5
ABSENCE_HIGH_DAYS = 10
SALARY_DROP_PERCENT = 25
SALARY_CHANGE_MIN_AMOUNT = 1_000_000
DEDUCTION_RATIO_LIMIT = 0.30
ANNIVERSARY_LOOKAHEAD_DAYS = 30
MILESTONE_YEARS = {1, 3, 5, 10, 15, 20, 25, 30}


def get_notifications(type_=None, is_read=None, limit=50, status=None, level=None):
    return list_notifications(type_, is_read, limit, status=status, level=level)


def mark_all_as_read():
    updated = mark_all_notifications_read()
    return {
        "success": True,
        "updated": updated,
        "message": f"Marked {updated} notifications as read",
    }


def _fetch_all_mysql(query: str, params: tuple = ()):  # PAYROLL database
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()


def _fetch_all_sqlserver(query: str, params: tuple = ()):  # HUMAN_2025 database
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        finally:
            cursor.close()
    finally:
        conn.close()


def _get(row, key, default=None):
    """Read values from either dict cursors or tuple-like cursors."""
    if isinstance(row, dict):
        return row.get(key, default)
    return default


def _create_once(type_, title, message, employee_id=None, level="LOW", status="OPEN"):
    if notification_exists(type_, employee_id=employee_id, title=title, status=status):
        return False

    create_notification(
        type_=type_,
        level=level,
        title=title,
        message=message,
        employee_id=employee_id,
        status=status,
    )
    return True


def _previous_month(month: int, year: int):
    if month == 1:
        return 12, year - 1
    return month - 1, year


def _month_end(month: int, year: int):
    return date(year, month, monthrange(year, month)[1])


def generate_attendance_notifications(month: int, year: int):
    """
    Generate leave and absence alerts from PAYROLL.attendance.
    Requirements covered:
    - Employees exceeding leave limits
    - Employees with frequent/excessive absences
    """
    generated = 0

    rows = _fetch_all_mysql(
        """
        SELECT
            a.EmployeeID,
            COALESCE(ep.FullName, CONCAT('NV_', a.EmployeeID)) AS FullName,
            COALESCE(SUM(a.WorkDays), 0) AS TotalWorkDays,
            COALESCE(SUM(a.AbsentDays), 0) AS TotalAbsentDays,
            COALESCE(SUM(a.LeaveDays), 0) AS TotalLeaveDays
        FROM attendance a
        LEFT JOIN employees_payroll ep ON ep.EmployeeID = a.EmployeeID
        WHERE MONTH(a.AttendanceMonth) = %s
          AND YEAR(a.AttendanceMonth) = %s
        GROUP BY a.EmployeeID, ep.FullName
        HAVING TotalAbsentDays >= %s OR TotalLeaveDays >= %s
        ORDER BY TotalAbsentDays DESC, TotalLeaveDays DESC
        """,
        (month, year, ABSENCE_MEDIUM_DAYS, LEAVE_LIMIT_DAYS),
    )

    for row in rows:
        employee_id = _get(row, "EmployeeID")
        full_name = _get(row, "FullName", f"NV_{employee_id}")
        absent_days = int(_get(row, "TotalAbsentDays", 0) or 0)
        leave_days = int(_get(row, "TotalLeaveDays", 0) or 0)

        if absent_days >= ABSENCE_HIGH_DAYS:
            level = "HIGH"
            title = f"Vắng mặt quá nhiều tháng {month}/{year}"
            message = (
                f"{full_name} đã vắng mặt {absent_days} ngày trong tháng "
                f"{month}/{year}. Cần kiểm tra và xử lý."
            )
        elif absent_days >= ABSENCE_MEDIUM_DAYS:
            level = "MEDIUM"
            title = f"Vắng mặt thường xuyên tháng {month}/{year}"
            message = (
                f"{full_name} đã vắng mặt {absent_days} ngày trong tháng "
                f"{month}/{year}. Cần theo dõi thêm."
            )
        else:
            level = "MEDIUM"
            title = f"Nghỉ phép vượt giới hạn tháng {month}/{year}"
            message = (
                f"{full_name} đã nghỉ phép {leave_days} ngày trong tháng "
                f"{month}/{year}, vượt ngưỡng {LEAVE_LIMIT_DAYS} ngày."
            )

        if _create_once(
            type_="ATTENDANCE",
            level=level,
            title=title,
            message=message,
            employee_id=employee_id,
        ):
            generated += 1

    return generated


def generate_salary_notifications(month: int, year: int):
    """
    Generate payroll discrepancy alerts from PAYROLL.salaries.
    Requirements covered:
    - Net salary <= 0
    - Net salary much lower than base salary
    - High deductions
    - Significant salary changes compared with previous payroll cycle
    """
    generated = 0
    previous_month, previous_year = _previous_month(month, year)

    rows = _fetch_all_mysql(
        """
        SELECT
            s.EmployeeID,
            COALESCE(ep.FullName, CONCAT('NV_', s.EmployeeID)) AS FullName,
            COALESCE(s.BaseSalary, 0) AS BaseSalary,
            COALESCE(s.Bonus, 0) AS Bonus,
            COALESCE(s.Deductions, 0) AS Deductions,
            COALESCE(s.NetSalary, 0) AS NetSalary,
            COALESCE(prev.NetSalary, 0) AS PreviousNetSalary
        FROM salaries s
        LEFT JOIN employees_payroll ep ON ep.EmployeeID = s.EmployeeID
        LEFT JOIN salaries prev
               ON prev.EmployeeID = s.EmployeeID
              AND MONTH(prev.SalaryMonth) = %s
              AND YEAR(prev.SalaryMonth) = %s
        WHERE MONTH(s.SalaryMonth) = %s
          AND YEAR(s.SalaryMonth) = %s
        """,
        (previous_month, previous_year, month, year),
    )

    for row in rows:
        employee_id = _get(row, "EmployeeID")
        full_name = _get(row, "FullName", f"NV_{employee_id}")
        base_salary = float(_get(row, "BaseSalary", 0) or 0)
        deductions = float(_get(row, "Deductions", 0) or 0)
        net_salary = float(_get(row, "NetSalary", 0) or 0)
        previous_net_salary = float(_get(row, "PreviousNetSalary", 0) or 0)

        if base_salary > 0 and net_salary <= 0:
            if _create_once(
                type_="PAYROLL",
                level="HIGH",
                title=f"Lương thực nhận bằng 0 tháng {month}/{year}",
                message=(
                    f"{full_name} có lương cơ bản {base_salary:,.0f} VND "
                    f"nhưng lương thực nhận bằng 0 trong tháng {month}/{year}."
                ),
                employee_id=employee_id,
            ):
                generated += 1

        elif base_salary > 0 and net_salary < base_salary * 0.5:
            if _create_once(
                type_="PAYROLL",
                level="MEDIUM",
                title=f"Lương thực nhận thấp bất thường tháng {month}/{year}",
                message=(
                    f"{full_name} có lương thực nhận {net_salary:,.0f} VND, "
                    f"thấp hơn 50% lương cơ bản {base_salary:,.0f} VND "
                    f"trong tháng {month}/{year}."
                ),
                employee_id=employee_id,
            ):
                generated += 1

        if base_salary > 0 and deductions > base_salary * DEDUCTION_RATIO_LIMIT:
            if _create_once(
                type_="PAYROLL",
                level="MEDIUM",
                title=f"Khấu trừ lương cao bất thường tháng {month}/{year}",
                message=(
                    f"{full_name} bị khấu trừ {deductions:,.0f} VND, "
                    f"vượt {DEDUCTION_RATIO_LIMIT:.0%} lương cơ bản trong tháng {month}/{year}."
                ),
                employee_id=employee_id,
            ):
                generated += 1

        if previous_net_salary > 0:
            difference = net_salary - previous_net_salary
            change_percent = abs(difference) / previous_net_salary * 100
            if change_percent >= SALARY_DROP_PERCENT and abs(difference) >= SALARY_CHANGE_MIN_AMOUNT:
                level = "HIGH" if difference < 0 else "MEDIUM"
                direction = "giảm" if difference < 0 else "tăng"
                if _create_once(
                    type_="PAYROLL",
                    level=level,
                    title=f"Biến động lương {direction} mạnh tháng {month}/{year}",
                    message=(
                        f"Lương thực nhận của {full_name} {direction} {abs(difference):,.0f} VND "
                        f"({change_percent:.1f}%) so với tháng {previous_month}/{previous_year}. "
                        f"Cần đối chiếu payroll cycle."
                    ),
                    employee_id=employee_id,
                ):
                    generated += 1

    return generated


def generate_anniversary_notifications(reference_date=None):
    """
    Generate work anniversary alerts from HUMAN_2025.Employees.
    Requirements covered:
    - Employees approaching work anniversaries
    - Milestones: 1, 3, 5, 10, 15, 20, 25, 30 years
    """
    generated = 0
    today = reference_date or datetime.now().date()
    end_date = today + timedelta(days=ANNIVERSARY_LOOKAHEAD_DAYS)

    employees = _fetch_all_sqlserver(
        """
        SELECT EmployeeID, FullName, HireDate, Status
        FROM Employees
        WHERE HireDate IS NOT NULL
          AND Status IN (N'Đang làm việc', N'Nghỉ phép', N'Active', N'Thử việc', N'Thực tập')
        """
    )

    for emp in employees:
        hire_date = emp.get("HireDate")
        if not hire_date:
            continue

        if hasattr(hire_date, "date"):
            hire_date = hire_date.date()

        for target_year in {today.year, end_date.year}:
            years = target_year - hire_date.year
            if years not in MILESTONE_YEARS:
                continue

            try:
                anniversary_date = hire_date.replace(year=target_year)
            except ValueError:
                # Handle Feb 29 hires in non-leap years.
                anniversary_date = date(target_year, 2, 28)

            if today <= anniversary_date <= end_date:
                employee_id = emp.get("EmployeeID")
                full_name = emp.get("FullName") or f"NV_{employee_id}"
                days_left = (anniversary_date - today).days

                if days_left == 0:
                    level = "MEDIUM"
                    title = f"Kỷ niệm {years} năm làm việc hôm nay"
                    timing = "hôm nay"
                else:
                    level = "LOW"
                    title = f"Sắp đến kỷ niệm {years} năm làm việc"
                    timing = f"sau {days_left} ngày"

                if _create_once(
                    type_="HR",
                    level=level,
                    title=title,
                    message=(
                        f"{full_name} đạt mốc {years} năm làm việc vào "
                        f"{anniversary_date.strftime('%d/%m/%Y')} ({timing})."
                    ),
                    employee_id=employee_id,
                ):
                    generated += 1
                break

    return generated


def generate_notifications(month: int = None, year: int = None):
    """
    Generate alerts from HR + Payroll without changing either source schema.
    If month/year are not supplied, use the current month.
    """
    now = datetime.now()
    target_month = int(month or now.month)
    target_year = int(year or now.year)

    generated_by_type = {
        "attendance": 0,
        "salary": 0,
        "anniversary": 0,
    }
    errors = []

    try:
        generated_by_type["attendance"] = generate_attendance_notifications(target_month, target_year)
    except Exception as exc:
        errors.append(f"Attendance notifications failed: {str(exc)}")

    try:
        generated_by_type["salary"] = generate_salary_notifications(target_month, target_year)
    except Exception as exc:
        errors.append(f"Salary notifications failed: {str(exc)}")

    try:
        generated_by_type["anniversary"] = generate_anniversary_notifications()
    except Exception as exc:
        errors.append(f"Anniversary notifications failed: {str(exc)}")

    generated = sum(generated_by_type.values())

    return {
        "success": len(errors) == 0,
        "generated": generated,
        "generated_by_type": generated_by_type,
        "errors": errors,
        "period": {"month": target_month, "year": target_year},
        "message": f"Generated {generated} notifications for {target_month}/{target_year}",
    }


def generate_all_notifications():
    return generate_notifications()
