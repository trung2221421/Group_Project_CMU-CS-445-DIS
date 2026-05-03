from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.config.sqlserver import get_sqlserver_db
from src.config.mysql import get_mysql_db
from src.modules.reports.reports_service import ReportService
from src.modules.reports.reports_schema import MonthlyReportResponse

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"]
)

@router.get("/monthly", response_model=MonthlyReportResponse)
def get_monthly_report(
    month: int = None,
    year: int = None,
    sqlserver_db: Session = Depends(get_sqlserver_db),
    mysql_db: Session = Depends(get_mysql_db)
):
    """
    Lấy dữ liệu báo cáo chuyên sâu theo tháng kèm phân tích tự động.
    """
    return ReportService.get_monthly_report(sqlserver_db, mysql_db, month, year)