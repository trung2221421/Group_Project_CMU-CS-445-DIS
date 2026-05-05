from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date

class SalarySchema(BaseModel):
    SalaryID: Optional[int] = None      # thêm ID để frontend gửi khi cập nhật
    BaseSalary: float
    Bonus: float
    Deductions: float
    NetSalary: float
    SalaryMonth: str

    @field_validator('SalaryMonth', mode='before')
    @classmethod
    def convert_date_to_str(cls, v):
        if isinstance(v, date):
            return v.strftime('%Y-%m')
        return v

class SalaryHistorySchema(BaseModel):
    salaries: List[SalarySchema]

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

class PayrollListItemSchema(BaseModel):
    SalaryID: Optional[int] = None      # thêm
    EmployeeID: int
    FullName: str
    DepartmentName: str
    BaseSalary: float
    Bonus: float
    Deductions: float
    NetSalary: float
    SalaryMonth: str

class UpdateSalaryRequest(BaseModel):
    employee_id: int
    month: str
    base_salary: float
    bonus: float
    deductions: float
    department_name: Optional[str] = None