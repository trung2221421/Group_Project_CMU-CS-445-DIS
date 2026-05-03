from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from src.config.sqlserver import get_sqlserver_db
from src.config.mysql import get_mysql_db
from src.modules.dashboard.dashboard_service import DashboardService
from src.modules.dashboard.dashboard_schema import DashboardSummaryResponse

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    month: int = Query(None, description="Tháng"),
    year: int = Query(None, description="Năm"),
    sqlserver_db: Session = Depends(get_sqlserver_db),
    mysql_db: Session = Depends(get_mysql_db)
):
    """
    Lấy dữ liệu tổng hợp cho Dashboard.
    Kết hợp dữ liệu nhân sự (SQL Server) và dữ liệu lương (MySQL).
    """
    return DashboardService.get_dashboard_summary(sqlserver_db, mysql_db, month, year)