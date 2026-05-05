from typing import Optional

from fastapi import APIRouter, Query

from src.modules.Dashboard.dashboard_schema import DashboardSummaryResponse
from src.modules.Dashboard.dashboard_service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    month: Optional[int] = Query(None, ge=1, le=12, description="Tháng cần xem"),
    year: Optional[int] = Query(None, ge=1900, le=3000, description="Năm cần xem"),
):
    return DashboardService.get_dashboard_summary(month=month, year=year)
