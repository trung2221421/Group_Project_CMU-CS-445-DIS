from fastapi import Depends, Query
from typing import Optional
from src.config.mysql import get_mysql_connection
from .attendance_repository import AttendanceRepository
from .attendance_service import AttendanceService
from fastapi.responses import StreamingResponse

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