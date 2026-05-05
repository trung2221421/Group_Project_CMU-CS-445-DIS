from fastapi import APIRouter, Depends
from typing import Optional
from .attendance_controller import (
    get_service,
    get_attendance,
    get_attendance_list,
    get_attendance_stats,
    export_attendance,
    get_employee_attendance_history,
    get_company_trend,
    get_department_trend,
    export_all_attendance,
    export_department_attendance
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# 1. Route cố định (phải đặt trước các route có path parameter)
@router.get("/list")
async def attendance_list(month: str, department_name: Optional[str] = None, search: Optional[str] = None, service = Depends(get_service)):
    return get_attendance_list(month, department_name, search, service)

@router.get("/stats")
async def stats(month: str, service = Depends(get_service)):
    return get_attendance_stats(month, service)

@router.get("/company-trend")
async def company_trend(months: int = 6, reference_month: Optional[str] = None, service = Depends(get_service)):
    return get_company_trend(months, reference_month, service)

@router.get("/department-trend")
async def department_trend(months: int = 6, reference_month: Optional[str] = None, department_name: str = None, service = Depends(get_service)):
    return get_department_trend(months, reference_month, department_name, service)

@router.get("/export-all")
async def export_all(month: str, service = Depends(get_service)):
    return export_all_attendance(month, service)

@router.get("/export-department")
async def export_dept(month: str, department_name: str, service = Depends(get_service)):
    return export_department_attendance(month, department_name, service)

@router.get("/export")
async def export(month: Optional[str] = None, service = Depends(get_service)):
    return export_attendance(month, service)

@router.get("/history/{employee_id}")
async def employee_history(employee_id: int, months: int = 6, service = Depends(get_service)):
    return get_employee_attendance_history(employee_id, months, service)

# 2. Route có path parameter (đặt cuối cùng)
@router.get("/{employee_id}")
async def employee_attendance(employee_id: int, month: str, service = Depends(get_service)):
    return get_attendance(employee_id, month, service)