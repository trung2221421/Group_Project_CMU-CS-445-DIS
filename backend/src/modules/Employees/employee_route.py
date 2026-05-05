from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional

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
    role: Optional[str] = Query(None)
):
    # Đã loại bỏ tham số user, không cần xác thực
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
async def delete_employee_route(emp_id: int = Path(...)):
    # Đã loại bỏ tham số user
    try:
        result = controller_delete_employee(emp_id)
        return result
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))