from fastapi import HTTPException
from typing import Optional
import pandas as pd
from io import BytesIO
import calendar
from datetime import datetime


class AttendanceService:
    def __init__(self, repo):
        self.repo = repo

    def get_attendance(self, employee_id: int, month: str):
        data = self.repo.get_attendance_by_month(employee_id, month)

        if not data:
            raise HTTPException(status_code=404, detail="Attendance not found")

        return data

    def get_attendance_list(
        self,
        month: str,
        department_name: Optional[str] = None,
        search: Optional[str] = None
    ):
        rows = self.repo.get_attendance_list_by_month(month, department_name, search)

        if not rows:
            return []

        result = []

        for row in rows:
            leave_days = row['LeaveDays'] or 0
            absent_days = row['AbsentDays'] or 0
            total_off = leave_days + absent_days

            status = "Bình thường"

            if absent_days >= 3:
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
            return {
                "TotalWorkDays": 0,
                "TotalLeaveDays": 0,
                "TotalAbsentDays": 0,
            }

        return {
            "TotalWorkDays": data['TotalWorkDays'] or 0,
            "TotalLeaveDays": data['TotalLeaveDays'] or 0,
            "TotalAbsentDays": data['TotalAbsentDays'] or 0,
        }

    def export_attendance_excel(self, month: Optional[str] = None):
        data = self.repo.get_attendance_for_export(month)

        if not data:
            raise HTTPException(status_code=404, detail="No attendance data to export")

        df = pd.DataFrame(data)

        df = df[[
            'EmployeeID',
            'FullName',
            'DepartmentName',
            'WorkDays',
            'LeaveDays',
            'AbsentDays',
            'AttendanceMonth'
        ]]

        df.columns = [
            'Mã NV',
            'Họ tên',
            'Phòng ban',
            'Ngày làm',
            'Nghỉ phép',
            'Vắng',
            'Tháng'
        ]

        output = BytesIO()

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance')

        output.seek(0)
        return output

    def get_employee_attendance_history(self, employee_id: int, months: int = 6):
        data = self.repo.get_attendance_history(employee_id, months)

        if not data:
            return []

        data_sorted = sorted(data, key=lambda x: x['AttendanceMonth'])
        return data_sorted

    def _days_in_month(self, year, month):
        return calendar.monthrange(year, month)[1]

    def _calc_trend(self, rows):
        result = []

        for row in rows:
            month = row['Month']
            year, month_num = map(int, month.split('-'))
            days = self._days_in_month(year, month_num)

            total_work_days = row['TotalWorkDays'] or 0
            employee_count = row['EmployeeCount'] or 0

            if employee_count > 0 and days > 0:
                percent = round((total_work_days / (employee_count * days)) * 100)
            else:
                percent = 0

            result.append({
                'Month': month,
                'Percent': percent,
                'TotalWorkDays': total_work_days,
                'EmployeeCount': employee_count
            })

        result.sort(key=lambda x: x['Month'])
        return result

    def get_company_attendance_trend(self, months: int = 6, reference_month: str = None):
        if reference_month is None:
            reference_month = datetime.now().strftime('%Y-%m')

        data = self.repo.get_company_attendance_trend(months, reference_month)

        if not data:
            return []

        return self._calc_trend(data)

    def get_department_attendance_trend(
        self,
        months: int = 6,
        reference_month: str = None,
        department_name: str = None
    ):
        if reference_month is None:
            reference_month = datetime.now().strftime('%Y-%m')

        if not department_name:
            return []

        data = self.repo.get_department_attendance_trend(
            months,
            reference_month,
            department_name
        )

        if not data:
            return []

        return self._calc_trend(data)

    def export_all_attendance_excel(self, month: str):
        data = self.repo.get_attendance_for_export_all(month)

        if not data:
            raise HTTPException(status_code=404, detail="No attendance data")

        df = pd.DataFrame(data)

        df = df[[
            'EmployeeID',
            'FullName',
            'DepartmentName',
            'WorkDays',
            'LeaveDays',
            'AbsentDays',
            'AttendanceMonth'
        ]]

        df.columns = [
            'Mã NV',
            'Họ tên',
            'Phòng ban',
            'Ngày làm',
            'Nghỉ phép',
            'Vắng',
            'Tháng'
        ]

        output = BytesIO()

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Toàn công ty', index=False)

        output.seek(0)
        return output

    def export_department_attendance_excel(self, month: str, department_name: str):
        data = self.repo.get_attendance_for_export_department(month, department_name)

        if not data:
            raise HTTPException(status_code=404, detail="No attendance data")

        df = pd.DataFrame(data)

        df = df[[
            'EmployeeID',
            'FullName',
            'DepartmentName',
            'WorkDays',
            'LeaveDays',
            'AbsentDays',
            'AttendanceMonth'
        ]]

        df.columns = [
            'Mã NV',
            'Họ tên',
            'Phòng ban',
            'Ngày làm',
            'Nghỉ phép',
            'Vắng',
            'Tháng'
        ]

        output = BytesIO()

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=department_name[:31], index=False)

        output.seek(0)
        return output