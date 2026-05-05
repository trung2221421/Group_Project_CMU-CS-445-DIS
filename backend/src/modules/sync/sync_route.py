from fastapi import APIRouter, Depends, Query
from .sync_service import (
    sync_all,
    sync_employees,
    sync_departments,
    sync_positions,
    list_sync_logs,
    list_sync_batches,
)

try:
    from src.modules.auth.auth_route import require_permission
except Exception:
    def require_permission(function_name: str, permission_name: str = "View"):
        def dependency():
            return None
        return dependency


router = APIRouter()


@router.post("/all")
async def run_full_sync(current_user=Depends(require_permission("Integration Sync", "Execute"))):
    return sync_all(actor=current_user)


@router.post("/employees")
async def run_employee_sync(current_user=Depends(require_permission("Integration Sync", "Execute"))):
    return sync_employees(actor=current_user)


@router.post("/departments")
async def run_department_sync(current_user=Depends(require_permission("Integration Sync", "Execute"))):
    return sync_departments(actor=current_user)


@router.post("/positions")
async def run_position_sync(current_user=Depends(require_permission("Integration Sync", "Execute"))):
    return sync_positions(actor=current_user)


@router.get("/logs")
async def get_logs(
    limit: int = Query(100),
    current_user=Depends(require_permission("Integration Sync", "View")),
):
    return list_sync_logs(limit)


@router.get("/batches")
async def get_batches(
    limit: int = Query(100),
    current_user=Depends(require_permission("Integration Sync", "View")),
):
    return list_sync_batches(limit)
