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

    def export_full_employee_report(self, employee_id: int, month: str):
        info = self.repo.get_employee_info(employee_id)
        if not info:
            raise HTTPException(404, "Employee not found")
        full_name = info['FullName']

        salary_data = self.repo.get_employee_salary_history_for_export(employee_id)
        attendance_data = self.repo.get_attendance_history(employee_id)

        df_sal = pd.DataFrame(salary_data) if salary_data else pd.DataFrame()
        df_att = pd.DataFrame(attendance_data) if attendance_data else pd.DataFrame()

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
            merged = pd.DataFrame(columns=[
                'Họ tên', 'Tháng', 'Ngày làm', 'Ngày nghỉ', 'Vắng',
                'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận'
            ])

        merged.insert(0, 'Họ tên', full_name)
        merged = merged[[
            'Họ tên', 'Tháng',
            'Ngày làm', 'Ngày nghỉ', 'Vắng',
            'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận'
        ]]
        merged = merged.sort_values('Tháng')

        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            merged.to_excel(writer, sheet_name='Chi tiết tổng hợp', index=False)
        output.seek(0)
        return output

    # Các hàm mới
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

    # Tổng lương 6 tháng (toàn công ty hoặc phòng ban)
    def get_salary_trend(self, months: int, reference_month: str, department_name: Optional[str] = None):
        rows = self.repo.get_salary_trend(months, reference_month, department_name)
        if not rows:
            return []

        sorted_rows = sorted(rows, key=lambda x: x['Month'])
        recent = sorted_rows[-months:]

        results = []
        for row in recent:
            existing = next((r for r in results if r['Month'] == row['Month']), None)
            if existing:
                existing['TotalNet'] += row['NetSalary']
            else:
                results.append({'Month': row['Month'], 'TotalNet': row['NetSalary']})

        results = sorted(results, key=lambda x: x['Month'])
        return results

    # Xuất Excel toàn bộ nhân viên trong tháng
    def export_all_employees_excel(self, month: str):
        data = self.repo.get_all_salaries_for_export(month)
        if not data:
            raise HTTPException(404, "No salary data for this month")
        df = pd.DataFrame(data)
        df = df[['EmployeeID', 'FullName', 'DepartmentName', 'BaseSalary', 'Bonus', 'Deductions', 'NetSalary', 'SalaryMonth']]
        df.columns = ['Mã NV', 'Họ tên', 'Phòng ban', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận', 'Tháng']
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Toàn công ty', index=False)
        output.seek(0)
        return output

    # Xuất Excel phòng ban trong tháng
    def export_by_department_excel(self, month: str, department_name: str):
        data = self.repo.get_salaries_by_department_for_export(month, department_name)
        if not data:
            raise HTTPException(404, "No salary data for this department in the month")
        df = pd.DataFrame(data)
        df = df[['EmployeeID', 'FullName', 'DepartmentName', 'BaseSalary', 'Bonus', 'Deductions', 'NetSalary', 'SalaryMonth']]
        df.columns = ['Mã NV', 'Họ tên', 'Phòng ban', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận', 'Tháng']
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=department_name[:31], index=False)
        output.seek(0)
        return output