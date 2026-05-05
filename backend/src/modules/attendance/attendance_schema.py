from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date

class AttendanceSchema(BaseModel):
    WorkDays: int
    LeaveDays: int
    AbsentDays: int
    AttendanceMonth: str

    @field_validator('AttendanceMonth', mode='before')
    @classmethod
    def convert_date_to_str(cls, v):
        if isinstance(v, date):
            return v.strftime('%Y-%m')
        return v

class AttendanceListItemSchema(BaseModel):
    EmployeeID: int
    FullName: str
    DepartmentName: str
    WorkDays: int
    LeaveDays: int
    AbsentDays: int
    TotalOff: int          # LeaveDays + AbsentDays
    Status: str            # Phân loại: "Bình thường", "Nghỉ nhiều", "Vắng quá hạn"
    AttendanceMonth: str

class AttendanceStatsSchema(BaseModel):
    TotalWorkDays: int
    TotalLeaveDays: int
    TotalAbsentDays: int