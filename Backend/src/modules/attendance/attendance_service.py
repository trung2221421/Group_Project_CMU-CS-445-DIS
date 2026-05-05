from fastapi import HTTPException
from typing import Optional
import pandas as pd
from io import BytesIO

class AttendanceService:
    def __init__(self, repo):
        self.repo = repo

    def get_attendance(self, employee_id: int, month: str):
        data = self.repo.get_attendance_by_month(employee_id, month)
        if not data:
            raise HTTPException(404, "Attendance not found")
        return data

    def get_attendance_list(self, month: str, department_name: Optional[str] = None, search: Optional[str] = None):
        rows = self.repo.get_attendance_list_by_month(month, department_name, search)
        if not rows:
            raise HTTPException(404, "No attendance data for this month")
        result = []
        for row in rows:
            total_off = row['LeaveDays'] + row['AbsentDays']
            status = "Bình thường"
            if row['AbsentDays'] >= 3:
                status = "Vắng quá hạn"
            elif total_off >= 3:
                status = "Nghỉ nhiều"
            result.append({
                **row,
                "TotalOff": total_off,
                "Status": status
            })
        return result

    def get_attendance_stats(self, month: str):
        data = self.repo.get_attendance_stats(month)
        if not data:
            raise HTTPException(404, "No attendance stats")
        return {
            "TotalWorkDays": data['TotalWorkDays'] or 0,
            "TotalLeaveDays": data['TotalLeaveDays'] or 0,
            "TotalAbsentDays": data['TotalAbsentDays'] or 0,
        }

    def export_attendance_excel(self, month: Optional[str] = None):
        data = self.repo.get_attendance_for_export(month)
        if not data:
            raise HTTPException(404, "No attendance data to export")

        df = pd.DataFrame(data)
        df = df[['EmployeeID', 'FullName', 'DepartmentName', 'WorkDays', 'LeaveDays', 'AbsentDays', 'AttendanceMonth']]
        df.columns = ['Mã NV', 'Họ tên', 'Phòng ban', 'Ngày làm', 'Nghỉ phép', 'Vắng', 'Tháng']

        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance')
        output.seek(0)
        return output

    # Lịch sử điểm danh của một nhân viên
    def get_employee_attendance_history(self, employee_id: int, months: int = 6):
        data = self.repo.get_attendance_history(employee_id, months)
        if not data:
            raise HTTPException(404, "No attendance history for this employee")
        # Sắp xếp tăng dần theo tháng để dễ vẽ biểu đồ
        data_sorted = sorted(data, key=lambda x: x['AttendanceMonth'])
        return data_sorted