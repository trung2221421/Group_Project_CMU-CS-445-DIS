from fastapi import Request, HTTPException
from .integration_service import IntegrationService, get_recent_sync_logs, init_dashboard_db

init_dashboard_db()

async def get_status():
    return IntegrationService.get_connection_status()

async def get_logs(limit: int = 50):
    return get_recent_sync_logs(limit)

async def sync_employees(request: Request):
    ok, msg = IntegrationService.sync_employees()
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": ok, "message": msg}

async def sync_departments(request: Request):
    ok, msg = IntegrationService.sync_departments()
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": ok, "message": msg}

async def sync_positions(request: Request):
    ok, msg = IntegrationService.sync_positions()
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": ok, "message": msg}

async def sync_all(request: Request):
    ok, msgs = IntegrationService.sync_all()
    if not ok:
        raise HTTPException(status_code=400, detail=msgs)
    return {"success": ok, "messages": msgs}
async def get_employee_comparison():
    return IntegrationService.get_employee_comparison()

async def get_department_comparison():
    return IntegrationService.get_department_comparison()

async def get_position_comparison():
    return IntegrationService.get_position_comparison()

async def get_sync_stats():
    return IntegrationService.get_sync_stats_24h()
async def sync_single_employee(emp_id: int, request: Request):
    ok, msg = IntegrationService.sync_single_employee(emp_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": ok, "message": msg}