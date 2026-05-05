from fastapi import APIRouter, HTTPException, Query
from src.modules.notifications.notification_service import (
    get_notifications,
    generate_notifications,
    mark_all_as_read,
)

router = APIRouter()


@router.get("/")
async def list_alerts(
    type: str = Query(None, description="Notification type, for example HR, PAYROLL, ATTENDANCE"),
    is_read: bool = Query(None, description="Filter by read status"),
    limit: int = Query(50, ge=1, le=500),
    status: str = Query(None, description="OPEN or CLOSED"),
    level: str = Query(None, description="LOW, MEDIUM, HIGH, or CRITICAL"),
):
    return get_notifications(type, is_read, limit, status=status, level=level)


@router.get("", include_in_schema=False)
async def list_alerts_without_slash(
    type: str = None,
    is_read: bool = None,
    limit: int = 50,
    status: str = None,
    level: str = None,
):
    return get_notifications(type, is_read, limit, status=status, level=level)


@router.post("/generate")
async def generate_alerts(
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=1900, le=3000),
):
    try:
        return generate_notifications(month=month, year=year)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Generate notifications failed: {str(exc)}",
        )


@router.put("/read-all")
async def read_all_alerts():
    return mark_all_as_read()
