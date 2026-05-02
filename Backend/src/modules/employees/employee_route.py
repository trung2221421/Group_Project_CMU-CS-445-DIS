# src/modules/employees/employee_route.py
"""
Employee Routes - Định nghĩa API endpoints
"""

from fastapi import APIRouter, Query
from typing import Optional

from .employee_controller import get_employees, get_filter_options

router = APIRouter()


@router.get("/filters")
async def filters():
    """
    GET /api/employees/filters
    Trả về danh sách departments và roles cho bộ lọc
    """
    return get_filter_options()


@router.get("/")
async def get_employees_list(
    dept: Optional[str] = Query(None, description="Tên phòng ban để lọc"),
    role: Optional[str] = Query(None, description="Tên chức vụ để lọc")
):
    """
    GET /api/employees
    Trả về danh sách nhân viên, có thể lọc theo phòng ban và chức vụ
    
    Query params:
    - dept: Tên phòng ban (optional)
    - role: Tên chức vụ (optional)
    """
    return get_employees(dept, role)