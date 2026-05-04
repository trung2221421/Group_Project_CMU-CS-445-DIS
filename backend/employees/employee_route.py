# src/modules/employees/employee_route.py
from fastapi import APIRouter, Query, HTTPException, Path, Depends
from typing import Optional

# Import từ module phân quyền mới
from src.middlewares.auth_middleware import get_current_user
from src.config.permissions import has_min_role

from .employee_controller import (
    get_employees,
    get_filter_options,
    get_single_employee,
    delete_employee as controller_delete_employee
)

router = APIRouter()

@router.get("/filters")
async def filters():
    return get_filter_options()

@router.get("/")
async def get_employees_list(
    dept: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    if not has_min_role(user, "truong_phong"):
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập danh sách nhân viên")
    return get_employees(dept, role)

@router.get("/{emp_id}")
async def get_employee(emp_id: int = Path(...)):
    try:
        employee = get_single_employee(emp_id)
        if employee is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        return employee
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{emp_id}")
async def delete_employee_route(
    emp_id: int = Path(...),
    user: dict = Depends(get_current_user)
):
    try:
        result = controller_delete_employee(emp_id, user)
        return result
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))