from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DepartmentBase(BaseModel):
    code: str
    name: str
    status: Optional[str] = "Synced"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    employee_count: Optional[int] = None
    synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True