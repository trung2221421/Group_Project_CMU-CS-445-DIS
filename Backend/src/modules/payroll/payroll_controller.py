from fastapi import Depends
from typing import Optional
from src.config.mysql import get_mysql_connection
from .payroll_repository import PayrollRepository
from .payroll_service import PayrollService
from datetime import datetime
from urllib.parse import quote              # thêm import này
from .payroll_schema import (
    SalarySchema,
    SalaryHistorySchema,
    AttendanceSchema,
    PayrollListItemSchema,
    UpdateSalaryRequest
)
from fastapi.responses import StreamingResponse

def get_service():
    conn = get_mysql_connection()
    try:
        repo = PayrollRepository(conn)
        yield PayrollService(repo)
    finally:
        conn.close()

def get_latest_salary(employee_id: int, service: PayrollService = Depends(get_service)):
    data = service.get_latest_salary(employee_id)
    return SalarySchema(**data)

def get_salary_history(employee_id: int, service: PayrollService = Depends(get_service)):
    data = service.get_salary_history(employee_id)
    salaries = [SalarySchema(**item) for item in data["salaries"]]
    return SalaryHistorySchema(salaries=salaries)

def get_salary_detail(employee_id: int, service: PayrollService = Depends(get_service)):
    data = service.get_salary_detail(employee_id)
    return SalarySchema(**data)

def get_attendance(employee_id: int, month: str, service: PayrollService = Depends(get_service)):
    data = service.get_attendance(employee_id, month)
    return AttendanceSchema(**data)

def get_salaries_by_month(
    month: str,
    department_name: Optional[str] = None,
    service: PayrollService = Depends(get_service)
):
    data = service.get_salaries_by_month(month, department_name)
    return [PayrollListItemSchema(**item) for item in data]

def export_employee_salary(
    employee_id: int,
    year: Optional[int] = None,
    service: PayrollService = Depends(get_service)
):
    excel_file = service.export_employee_salary_excel(employee_id, year)
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=salary_history_{employee_id}_{year or 'all'}.xlsx"}
    )

# MỚI: Xuất báo cáo tổng hợp
def export_full_employee_report(
    employee_id: int,
    month: str,
    service: PayrollService = Depends(get_service)
):
    excel_file = service.export_full_employee_report(employee_id, month)
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=employee_report_{employee_id}.xlsx"}
    )   
def get_departments(service: PayrollService = Depends(get_service)):
    return service.get_departments()

# MỚI: Cập nhật lương
def update_salary(req: UpdateSalaryRequest, service: PayrollService = Depends(get_service)):
    return service.update_employee_salary(req)

# MỚI: Xoá nhân viên
def delete_employee(employee_id: int, service: PayrollService = Depends(get_service)):
    return service.delete_employee_data(employee_id)

def get_salary_trend(
    months: int = 6,
    reference_month: Optional[str] = None,
    department_name: Optional[str] = None,
    service: PayrollService = Depends(get_service)
):
    if reference_month is None:
        reference_month = datetime.now().strftime('%Y-%m')
    return service.get_salary_trend(months, reference_month, department_name)
def export_all_employees(month: str, service: PayrollService = Depends(get_service)):
    excel_file = service.export_all_employees_excel(month)
    safe_month = quote(month, safe='')
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=all_employees_{safe_month}.xlsx"}
    )

def export_by_department(month: str, department_name: str, service: PayrollService = Depends(get_service)):
    excel_file = service.export_by_department_excel(month, department_name)
    # Mã hóa tên phòng ban để tránh lỗi Unicode trong header
    safe_dept = quote(department_name, safe='')
    safe_month = quote(month, safe='')
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=department_{safe_dept}_{safe_month}.xlsx"}
    )