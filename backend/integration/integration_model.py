# backend/src/modules/integration/integration_model.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ConnectionStatus(BaseModel):
    database: str
    status: str  # "connected" or "failed"
    latency_ms: Optional[int] = None
    error: Optional[str] = None


class SyncLog(BaseModel):
    id: Optional[int] = None
    sync_type: str  # "employees", "departments", "positions", "full"
    status: str  # "success", "failed", "partial"
    message: str
    details: Optional[str] = None
    created_at: datetime = datetime.now()


class EmployeeSyncCompare(BaseModel):
    hr_employees_count: int
    payroll_employees_count: int
    mismatches: list[dict]  # employees that differ


class SyncResult(BaseModel):
    success: bool
    message: str
    entities_synced: list[str]
    errors: list[str]