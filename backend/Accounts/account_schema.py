# src/modules/Accounts/account_schema.py
from pydantic import BaseModel, Field
from typing import Optional

class CreateAccountRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=255)
    employee_id: int
    full_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    is_active: bool = True

class UpdateAccountRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None