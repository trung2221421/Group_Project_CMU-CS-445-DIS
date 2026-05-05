from fastapi import APIRouter, Depends
from typing import List, Optional
from .payroll_controller import (
    get_service,                     # import get_service
    get_latest_salary,
    get_salary_history,
    get_salary_detail,
    get_attendance,
    get_salaries_by_month,
    export_employee_salary,
    export_full_employee_report,
    get_departments,                 # thêm các hàm mới
    update_salary,
    delete_employee
)
from .payroll_schema import (
    SalarySchema,
    SalaryHistorySchema,
    AttendanceSchema,
    PayrollListItemSchema,
    UpdateSalaryRequest              # thêm import
)

router = APIRouter(prefix="/payroll", tags=["Payroll"])

@router.get("/{employee_id}/latest-salary", response_model=SalarySchema)
async def latest_salary(employee_id: int, service = Depends(get_service)):
    return get_latest_salary(employee_id, service)

@router.get("/{employee_id}/salary-history", response_model=SalaryHistorySchema)
async def salary_history(employee_id: int, service = Depends(get_service)):
    return get_salary_history(employee_id, service)

@router.get("/{employee_id}/salary-detail", response_model=SalarySchema)
async def salary_detail(employee_id: int, service = Depends(get_service)):
    return get_salary_detail(employee_id, service)

@router.get("/{employee_id}/attendance", response_model=AttendanceSchema)
async def attendance(employee_id: int, month: str, service = Depends(get_service)):
    return get_attendance(employee_id, month, service)

@router.get("/salaries", response_model=List[PayrollListItemSchema])
async def salaries_list(
    month: str,
    department_name: Optional[str] = None,
    service = Depends(get_service)
):
    return get_salaries_by_month(month, department_name, service)

@router.get("/export/{employee_id}")
async def export_salary(
    employee_id: int,
    year: Optional[int] = None,
    service = Depends(get_service)
):
    return export_employee_salary(employee_id, year, service)

@router.get("/export-full/{employee_id}")
async def export_full_report(
    employee_id: int,
    month: str,
    service = Depends(get_service)
):
    return export_full_employee_report(employee_id, month, service)

@router.get("/departments")
async def departments(service = Depends(get_service)):
    return get_departments(service)

@router.put("/update-salary")
async def update_salary_route(req: UpdateSalaryRequest, service = Depends(get_service)):
    return update_salary(req, service)

@router.delete("/delete-employee/{employee_id}")
async def delete_employee_route(employee_id: int, service = Depends(get_service)):
    return delete_employee(employee_id, service)