from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    hire_date: Optional[date] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    sync_to_payroll: bool = True

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    hire_date: Optional[date] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    sync_to_payroll: Optional[bool] = None