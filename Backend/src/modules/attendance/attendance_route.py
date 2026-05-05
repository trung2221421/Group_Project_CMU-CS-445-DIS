from fastapi import APIRouter, Depends
from typing import Optional
from .attendance_controller import (
    get_service,
    get_attendance,
    get_attendance_list,
    get_attendance_stats,
    export_attendance
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# 1. Route cố định ĐẶT TRƯỚC
@router.get("/list")
async def attendance_list(
    month: str,
    department_name: Optional[str] = None,
    search: Optional[str] = None,
    service = Depends(get_service)
):
    return get_attendance_list(month, department_name, search, service)

@router.get("/stats")
async def stats(
    month: str,
    service = Depends(get_service)
):
    return get_attendance_stats(month, service)

@router.get("/export")
async def export(
    month: Optional[str] = None,
    service = Depends(get_service)
):
    return export_attendance(month, service)

from fastapi import APIRouter, Depends
from typing import Optional
from .attendance_controller import (
    get_service,
    get_attendance,
    get_attendance_list,
    get_attendance_stats,
    export_attendance,
    get_employee_attendance_history   # thêm import
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# Route cố định
@router.get("/list")
async def attendance_list(month: str, department_name: Optional[str] = None, search: Optional[str] = None, service = Depends(get_service)):
    return get_attendance_list(month, department_name, search, service)

@router.get("/stats")
async def stats(month: str, service = Depends(get_service)):
    return get_attendance_stats(month, service)

@router.get("/export")
async def export(month: Optional[str] = None, service = Depends(get_service)):
    return export_attendance(month, service)

# Route mới: lịch sử điểm danh của một nhân viên
@router.get("/history/{employee_id}")
async def employee_attendance_history(employee_id: int, months: int = 6, service = Depends(get_service)):
    return get_employee_attendance_history(employee_id, months, service)

# Route có path parameter (đặt cuối cùng)
@router.get("/{employee_id}")
async def employee_attendance(employee_id: int, month: str, service = Depends(get_service)):
    return get_attendance(employee_id, month, service)

# 2. Route có path parameter ĐẶT SAU CÙNG
@router.get("/{employee_id}")
async def employee_attendance(
    employee_id: int,
    month: str,
    service = Depends(get_service)
):
    return get_attendance(employee_id, month, service)
