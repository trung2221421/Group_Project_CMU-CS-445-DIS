from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from src.modules.dashboard.dashboard_model_sql import Employee, Department, Dividend
from src.modules.dashboard.dashboard_model_mysql import Salary, Attendance
from src.modules.reports.reports_schema import (
    MonthlyReportResponse, ReportStats, TopAbsentEmployee, SalaryTrendItem, 
    AnalysisText, DepartmentDataItem, DividendRow
)

class ReportService:
    @staticmethod
    def get_monthly_report(sqlserver_db: Session, mysql_db: Session, month: int = None, year: int = None) -> MonthlyReportResponse:
        now = datetime.now()
        target_month = month if month else now.month
        target_year = year if year else now.year

        all_depts = sqlserver_db.query(Department).all()
        dept_map = {d.DepartmentID: d.DepartmentName for d in all_depts}

        # 1. Thống kê Chuyên cần & Lương tổng (MySQL)
        attendance_stats = mysql_db.query(
            func.sum(Attendance.WorkDays).label('work'),
            func.sum(Attendance.LeaveDays).label('leave'),
            func.sum(Attendance.AbsentDays).label('absent')
        ).filter(extract('month', Attendance.AttendanceMonth) == target_month, extract('year', Attendance.AttendanceMonth) == target_year).first()

        total_payroll_val = mysql_db.query(func.sum(Salary.NetSalary)).filter(
            extract('month', Salary.SalaryMonth) == target_month, extract('year', Salary.SalaryMonth) == target_year
        ).scalar() or 0

        # 2. Thống kê Nhân sự & Giới tính (SQL Server)
        total_emp = sqlserver_db.query(func.count(Employee.EmployeeID)).scalar() or 0
        male_count = sqlserver_db.query(func.count(Employee.EmployeeID)).filter(Employee.Gender.in_(['Nam', 'Male', 'M'])).scalar() or 0
        female_count = sqlserver_db.query(func.count(Employee.EmployeeID)).filter(Employee.Gender.in_(['Nữ', 'Female', 'F'])).scalar() or 0

        # 3. Biểu đồ phòng ban
        dept_counts = sqlserver_db.query(Employee.DepartmentID, func.count(Employee.EmployeeID)).group_by(Employee.DepartmentID).all()
        department_data = [DepartmentDataItem(name=dept_map.get(d_id, "Khác"), value=count) for d_id, count in dept_counts if count > 0]

        # 4. Xu hướng lương (6 tháng gần nhất)
        trend_records = mysql_db.query(Salary.SalaryMonth, func.sum(Salary.NetSalary)).filter(extract('year', Salary.SalaryMonth) == target_year).group_by(Salary.SalaryMonth).order_by(Salary.SalaryMonth.desc()).limit(6).all()
        salary_trend = [SalaryTrendItem(month=str(r[0]), total=float(r[1])) for r in reversed(trend_records)]

        # 5. Dữ liệu Cổ tức
        divs = sqlserver_db.query(Dividend, Employee).join(Employee, Dividend.EmployeeID == Employee.EmployeeID).filter(
            extract('month', Dividend.DividendDate) == target_month, extract('year', Dividend.DividendDate) == target_year
        ).all()
        dividends_list = [DividendRow(id=str(e.EmployeeID), name=e.FullName, dept=dept_map.get(e.DepartmentID, "--"), amount=float(d.DividendAmount), date=str(d.DividendDate)) for d, e in divs]

        # 6. Top vắng mặt
        top_abs = mysql_db.query(Attendance.EmployeeID, func.sum(Attendance.AbsentDays)).filter(
            extract('month', Attendance.AttendanceMonth) == target_month, extract('year', Attendance.AttendanceMonth) == target_year, Attendance.AbsentDays > 0
        ).group_by(Attendance.EmployeeID).order_by(func.sum(Attendance.AbsentDays).desc()).limit(5).all()
        top_absent_list = []
        for emp_id, count in top_abs:
            e = sqlserver_db.query(Employee).filter(Employee.EmployeeID == emp_id).first()
            if e: top_absent_list.append(TopAbsentEmployee(id=str(e.EmployeeID), name=e.FullName, dept=dept_map.get(e.DepartmentID, "--"), absentCount=int(count), reason="Cần nhắc nhở"))

        # 7. Dữ liệu Lương chi tiết
        all_emps = sqlserver_db.query(Employee).all()
        salaries = mysql_db.query(Salary).filter(extract('month', Salary.SalaryMonth) == target_month, extract('year', Salary.SalaryMonth) == target_year).all()
        sal_map = {s.EmployeeID: s for s in salaries}
        payroll_rows = []
        for e in all_emps:
            s_rec = sal_map.get(e.EmployeeID)
            net = float(s_rec.NetSalary) if s_rec else 0
            payroll_rows.append({"id": str(e.EmployeeID), "name": e.FullName, "dept": dept_map.get(e.DepartmentID, "--"), "salary": net, "status": "Đã duyệt" if net > 0 else "Chờ xử lý"})

        return MonthlyReportResponse(
            stats=ReportStats(monthlyPayroll=f"{total_payroll_val:,.0f} VND", workDays=int(attendance_stats.work or 0), leaveDays=int(attendance_stats.leave or 0), absentDays=int(attendance_stats.absent or 0), totalEmployees=total_emp, maleCount=male_count, femaleCount=female_count),
            topAbsentEmployees=top_absent_list, salaryTrend=salary_trend, payrollRows=payroll_rows, departmentData=department_data, dividendsData=dividends_list,
            analysis=AnalysisText(
                salaryText=f"Chi phí lương tháng {target_month} duy trì ổn định.", attendanceText=f"Ghi nhận {attendance_stats.absent or 0} ngày vắng mặt.",
                employeeText=f"Quy mô {total_emp} nhân sự.", dividendText=f"Chi trả cổ tức cho {len(dividends_list)} nhân sự."
            )
        )