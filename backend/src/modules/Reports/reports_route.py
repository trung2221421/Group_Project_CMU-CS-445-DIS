from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Any, Dict
import logging

from src.modules.Reports.reports_service import get_monthly_report

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


@router.get("/monthly")
async def get_monthly_report_endpoint(
    month: int = Query(..., ge=1, le=12, description="Tháng báo cáo (1-12)"),
    year: int = Query(..., ge=1900, le=2100, description="Năm báo cáo"),
) -> Dict[str, Any]:
    """Lấy báo cáo tổng hợp tháng cho màn hình Reports.jsx."""
    try:
        logger.info("Fetching monthly report for %s/%s", month, year)
        report = get_monthly_report(month=month, year=year)

        return JSONResponse(
            status_code=200,
            content={
                "data": {
                    "month": report.month,
                    "year": report.year,
                    "stats": report.stats.model_dump(),
                    "topAbsentEmployees": [
                        item.model_dump() for item in report.topAbsentEmployees
                    ],
                    "salaryTrend": [item.model_dump() for item in report.salaryTrend],
                    "payrollRows": report.payrollRows,
                    "departmentData": [
                        item.model_dump() for item in report.departmentData
                    ],
                    "dividendsData": [item.model_dump() for item in report.dividendsData],
                    "analysis": report.analysis.model_dump(),
                }
            },
        )
    except Exception as exc:
        logger.error("Error generating monthly report: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi tạo báo cáo tháng {month}/{year}: {exc}",
        ) from exc
