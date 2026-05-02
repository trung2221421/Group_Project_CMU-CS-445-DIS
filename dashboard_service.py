from sqlalchemy.orm import Session
from sqlalchemy import func, or_, extract
from datetime import datetime
from src.modules.dashboard.dashboard_schema import DashboardSummaryResponse, DashboardStats
from src.modules.dashboard.dashboard_model_sql import Employee, Department
from src.modules.dashboard.dashboard_model_mysql import Salary, Attendance

class DashboardService:

    @staticmethod
    def get_dashboard_summary(sqlserver_db: Session, mysql_db: Session, month: int = None, year: int = None) -> DashboardSummaryResponse:
        now = datetime.now()
        
        # Bắt tháng và năm từ Frontend gửi lên, nếu trống thì dùng mặc định
        target_month = month if month else now.month
        target_year = year if year else now.year

        # ==========================================
        # 1. LẤY DỮ LIỆU TỪ SQL SERVER (HUMAN_2025)
        # ==========================================
        total_employees = sqlserver_db.query(Employee).count()

        new_hires = sqlserver_db.query(Employee).filter(
            extract('month', Employee.HireDate) == target_month,
            extract('year', Employee.HireDate) == target_year
        ).count()

        gender_counts = sqlserver_db.query(Employee.Gender, func.count(Employee.EmployeeID)).group_by(Employee.Gender).all()
        gender_data = [{"name": g[0], "value": g[1]} for g in gender_counts]

        full_time_employees = sqlserver_db.query(Employee).filter(
            or_(
                func.trim(Employee.Status).like('Đang làm việc'),
                func.trim(Employee.Status).like('Nghỉ phép')
            )
        ).count()

        # BIỂU ĐỒ PHÒNG BAN: Lấy theo số DepartmentID cho an toàn
        dept_counts = sqlserver_db.query(
            Employee.DepartmentID,
            func.count(Employee.EmployeeID)
        ).group_by(Employee.DepartmentID).all()
        
        departments_data = [
            [f"Phòng ban {dept_id}", int((count/total_employees)*100) if total_employees > 0 else 0, count]
            for dept_id, count in dept_counts
        ]

        # ==========================================
        # 2. LẤY DỮ LIỆU TỪ MYSQL (PAYROLL_2026)
        # ==========================================
        attendance_stats = mysql_db.query(
            func.sum(Attendance.WorkDays).label('work'),
            func.sum(Attendance.LeaveDays).label('leave'),
            func.sum(Attendance.AbsentDays).label('absent')
        ).filter(
            extract('month', Attendance.AttendanceMonth) == target_month,
            extract('year', Attendance.AttendanceMonth) == target_year
        ).first()

        total_payroll = mysql_db.query(func.sum(Salary.NetSalary)).filter(
            extract('month', Salary.SalaryMonth) == target_month,
            extract('year', Salary.SalaryMonth) == target_year
        ).scalar() or 0
        
        total_leave_days = attendance_stats.leave if attendance_stats and attendance_stats.leave else 0
        total_work_days = attendance_stats.work if attendance_stats and attendance_stats.work else 0
        total_absent_days = attendance_stats.absent if attendance_stats and attendance_stats.absent else 0
        
        # ==========================================
        # 🌟 CHIẾN THUẬT: KHÔNG JOIN, CHỈ LẤY SỐ ID
        # ==========================================
        
        # BƯỚC A: Lấy danh sách NV (Chỉ dùng đúng 1 bảng Employee)
        employees_sql = sqlserver_db.query(Employee).all()

        # BƯỚC B: Lấy lương tháng hiện tại từ MySQL
        salaries_mysql = mysql_db.query(Salary).filter(
            extract('month', Salary.SalaryMonth) == target_month,
            extract('year', Salary.SalaryMonth) == target_year
        ).all()
        
        # BƯỚC C: Tạo bộ từ điển (Dictionary) để dò tìm lương
        salary_map = {s.EmployeeID: s for s in salaries_mysql}

        # BƯỚC D: Lắp ráp dữ liệu
        payroll_rows = []
        for emp_obj in employees_sql:
            # Tra cứu xem nhân viên này có lương tháng đó chưa
            salary_record = salary_map.get(emp_obj.EmployeeID)
            
            base_sal = float(getattr(salary_record, "BaseSalary", 0)) if salary_record else 0
            net_sal = float(getattr(salary_record, "NetSalary", 0)) if salary_record else 0

            # Xử lý Ngày sinh tránh lỗi null/None
            try:
                dob_val = emp_obj.DateOfBirth
                dob_str = dob_val.strftime("%Y-%m-%d") if dob_val else "---"
            except AttributeError:
                dob_str = "---"

            # LẤY SỐ ID CỦA PHÒNG BAN VÀ VỊ TRÍ CỰC KỲ AN TOÀN
            try:
                dept_id = emp_obj.DepartmentID
                dept_display = f"Phòng {dept_id}" if dept_id is not None else "---"
            except AttributeError:
                dept_display = "---"

            try:
                pos_id = emp_obj.PositionID
                pos_display = f"Vị trí {pos_id}" if pos_id is not None else "---"
            except AttributeError:
                pos_display = "---"

            payroll_rows.append({
                "id": getattr(emp_obj, "EmployeeID", "---"),
                "name": getattr(emp_obj, "FullName", "N/A"),
                "dob": dob_str,
                "gender": getattr(emp_obj, "Gender", "---") or "---",
                
                # HIỂN THỊ DƯỚI DẠNG "Phòng 1", "Vị trí 2"
                "dept": dept_display,
                "pos": pos_display,
                
                "salary": base_sal,
                "status": "approved" if net_sal > 0 else "pending"
            })

        # --- LOGIC XU HƯỚNG LƯƠNG ---
        trend_records = mysql_db.query(
            Salary.SalaryMonth,
            func.sum(Salary.NetSalary).label('total_salary')
        ).filter(
            extract('year', Salary.SalaryMonth) == target_year
        ).group_by(Salary.SalaryMonth).order_by(Salary.SalaryMonth.desc()).limit(6).all()

        salary_trend = [
            {
                "month": str(record.SalaryMonth),
                "total": float(record.total_salary) if record.total_salary else 0
            }
            for record in reversed(trend_records)
        ]

        # ==========================================
        # 3. TRẢ VỀ KẾT QUẢ CHO DASHBOARD
        # ==========================================
        return DashboardSummaryResponse(
            stats=DashboardStats(
                totalEmployees=total_employees,
                fullTimeEmployees=full_time_employees,
                totalDepartments=len(dept_counts),
                monthlyPayroll=f"{total_payroll:,.0f} VND",
                leaveDays=int(total_leave_days),
                workDays=int(total_work_days),
                absentDays=int(total_absent_days),
                alerts=sum(1 for r in payroll_rows if r["status"] == "pending")
            ),
            departmentsData=departments_data,
            recentActivities=[f"Dữ liệu được cập nhật cho Tháng {target_month}/{target_year}"],
            payrollRows=payroll_rows,
            salaryTrend=salary_trend
        )