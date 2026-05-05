from fastapi import Depends, Query
from typing import Optional
from src.config.payroll_mysql import get_mysql_connection
from .attendance_repository import AttendanceRepository
from .attendance_service import AttendanceService
from fastapi.responses import StreamingResponse
from urllib.parse import quote

def get_service():
    conn = get_mysql_connection()
    try:
        repo = AttendanceRepository(conn)
        yield AttendanceService(repo)
    finally:
        conn.close()

def get_attendance(
    employee_id: int,
    month: str,
    service: AttendanceService = Depends(get_service)
):
    return service.get_attendance(employee_id, month)

def get_attendance_list(
    month: str,
    department_name: Optional[str] = None,
    search: Optional[str] = None,
    service: AttendanceService = Depends(get_service)
):
    return service.get_attendance_list(month, department_name, search)

def get_attendance_stats(
    month: str,
    service: AttendanceService = Depends(get_service)
):
    return service.get_attendance_stats(month)

def export_attendance(
    month: Optional[str] = None,
    service: AttendanceService = Depends(get_service)
):
    excel_file = service.export_attendance_excel(month)
    filename = f"attendance_{month or 'all'}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
def get_employee_attendance_history(
    employee_id: int,
    months: int = 6,
    service: AttendanceService = Depends(get_service)
):
    return service.get_employee_attendance_history(employee_id, months)
def get_company_trend(
    months: int = 6,
    reference_month: Optional[str] = None,
    service: AttendanceService = Depends(get_service)
):
    return service.get_company_attendance_trend(months, reference_month)

def get_department_trend(
    months: int = 6,
    reference_month: Optional[str] = None,
    department_name: str = None,
    service: AttendanceService = Depends(get_service)
):
    return service.get_department_attendance_trend(months, reference_month, department_name)

def export_all_attendance(month: str, service: AttendanceService = Depends(get_service)):
    excel = service.export_all_attendance_excel(month)
    return StreamingResponse(
        excel,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=attendance_all_{month}.xlsx"}
    )

def export_department_attendance(month: str, department_name: str, service: AttendanceService = Depends(get_service)):
    excel = service.export_department_attendance_excel(month, department_name)
    return StreamingResponse(
        excel,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=attendance_dept_{department_name}_{month}.xlsx"}
    )
def export_department_attendance(month: str, department_name: str, service: AttendanceService = Depends(get_service)):
    excel = service.export_department_attendance_excel(month, department_name)
    safe_dept = quote(department_name, safe='')
    safe_month = quote(month, safe='')
    return StreamingResponse(
        excel,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=attendance_dept_{safe_dept}_{safe_month}.xlsx"}
    )