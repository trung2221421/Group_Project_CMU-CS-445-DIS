from fastapi import HTTPException
from typing import Optional
import pandas as pd
from io import BytesIO

class PayrollService:
    def __init__(self, repo):
        self.repo = repo

    def get_latest_salary(self, employee_id: int):
        data = self.repo.get_latest_salary(employee_id)
        if not data:
            raise HTTPException(404, "Salary not found")
        return data

    def get_salary_history(self, employee_id: int):
        data = self.repo.get_salary_history(employee_id)
        if not data:
            raise HTTPException(404, "No salary history")
        return {"salaries": data}

    def get_salary_detail(self, employee_id: int):
        data = self.repo.get_latest_salary(employee_id)
        if not data:
            raise HTTPException(404, "Salary detail not found")
        return data

    def get_attendance(self, employee_id: int, month: str):
        data = self.repo.get_attendance_by_month(employee_id, month)
        if not data:
            raise HTTPException(404, "Attendance not found")
        return data

    def get_salaries_by_month(self, month: str, department_name: Optional[str] = None):
        data = self.repo.get_salaries_by_month(month, department_name)
        if not data:
            raise HTTPException(404, "No salary data for this month")
        return data

    # Xuất Excel lịch sử lương theo năm (giữ nguyên)
    def export_employee_salary_excel(self, employee_id: int, year: Optional[int] = None):
        data = self.repo.get_employee_salary_history_for_export(employee_id, year)
        if not data:
            raise HTTPException(404, "No salary data to export")
        df = pd.DataFrame(data)
        if not df.empty:
            df = df[['SalaryMonth', 'BaseSalary', 'Bonus', 'Deductions', 'NetSalary']]
            df.columns = ['Tháng', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận']
        else:
            df = pd.DataFrame(columns=['Tháng', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận'])
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='SalaryHistory')
        output.seek(0)
        return output

    # MỚI: Xuất báo cáo tổng hợp kết hợp điểm danh + lương
    def export_full_employee_report(self, employee_id: int, month: str):
        # Lấy thông tin nhân viên
        info = self.repo.get_employee_info(employee_id)
        if not info:
            raise HTTPException(404, "Employee not found")
        full_name = info['FullName']

        # Lấy toàn bộ lịch sử lương (đã loại bỏ trùng)
        salary_data = self.repo.get_employee_salary_history_for_export(employee_id)
        # Lấy toàn bộ điểm danh
        attendance_data = self.repo.get_attendance_history(employee_id)

        # Chuyển sang DataFrame
        df_sal = pd.DataFrame(salary_data) if salary_data else pd.DataFrame()
        df_att = pd.DataFrame(attendance_data) if attendance_data else pd.DataFrame()

        # Chuẩn hóa tên cột
        if not df_sal.empty:
            df_sal = df_sal.rename(columns={
                'SalaryMonth': 'Tháng',
                'BaseSalary': 'Lương cơ bản',
                'Bonus': 'Thưởng',
                'Deductions': 'Khấu trừ',
                'NetSalary': 'Thực nhận'
            })
            df_sal = df_sal[['Tháng', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận']]

        if not df_att.empty:
            df_att = df_att.rename(columns={
                'AttendanceMonth': 'Tháng',
                'WorkDays': 'Ngày làm',
                'LeaveDays': 'Ngày nghỉ',
                'AbsentDays': 'Vắng'
            })
            df_att = df_att[['Tháng', 'Ngày làm', 'Ngày nghỉ', 'Vắng']]

        # Merge hai DataFrame theo 'Tháng' (outer join để lấy tất cả tháng)
        if not df_sal.empty and not df_att.empty:
            merged = pd.merge(df_sal, df_att, on='Tháng', how='outer')
        elif not df_sal.empty:
            merged = df_sal.copy()
            merged['Ngày làm'] = ''
            merged['Ngày nghỉ'] = ''
            merged['Vắng'] = ''
        elif not df_att.empty:
            merged = df_att.copy()
            merged['Lương cơ bản'] = ''
            merged['Thưởng'] = ''
            merged['Khấu trừ'] = ''
            merged['Thực nhận'] = ''
        else:
            # Không có dữ liệu nào
            merged = pd.DataFrame(columns=[
                'Họ tên', 'Tháng', 'Ngày làm', 'Ngày nghỉ', 'Vắng',
                'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận'
            ])

        # Thêm cột Họ tên
        merged.insert(0, 'Họ tên', full_name)

        # Sắp xếp cột theo thứ tự mong muốn
        merged = merged[[
            'Họ tên', 'Tháng',
            'Ngày làm', 'Ngày nghỉ', 'Vắng',
            'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận'
        ]]

        # Sắp xếp theo Tháng tăng dần
        merged = merged.sort_values('Tháng')

        # Ghi ra file Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            merged.to_excel(writer, sheet_name='Chi tiết tổng hợp', index=False)

        output.seek(0)
        return output
    def __init__(self, repo):
        self.repo = repo

    # Các hàm cũ giữ nguyên (không liệt kê lại)
    # ...

    # Thêm các hàm mới:
    def get_departments(self):
        data = self.repo.get_all_departments()
        if not data:
            raise HTTPException(404, "No departments found")
        return data

    def update_employee_salary(self, req):
        self.repo.update_salary_and_department(
            req.employee_id, req.month,
            req.base_salary, req.bonus, req.deductions,
            req.department_name
        )
        return {"message": "Cập nhật thành công"}

    def delete_employee_data(self, employee_id: int):
        self.repo.delete_employee_payroll_data(employee_id)
        return {"message": "Đã xoá dữ liệu nhân viên"}