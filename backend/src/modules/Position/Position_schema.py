from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PositionBase(BaseModel):
    title: str
    description: Optional[str] = None
    department_id: Optional[int] = None

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None

class PositionResponse(PositionBase):
    id: int
    department_name: Optional[str] = None
    synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True