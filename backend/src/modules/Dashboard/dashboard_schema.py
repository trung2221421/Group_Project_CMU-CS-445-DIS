from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardStats(BaseModel):
    totalEmployees: int
    fullTimeEmployees: int
    totalDepartments: int
    totalPositions: int = 0
    monthlyPayroll: str
    leaveDays: int
    workDays: int
    absentDays: int
    alerts: int
    
# 1. Khai báo cấu trúc cho từng cột trong biểu đồ
class SalaryTrendItem(BaseModel):
    month: str
    total: float

class DashboardSummaryResponse(BaseModel):
    stats: DashboardStats
    departmentsData: List[List[Any]] # Dữ liệu phòng ban (mảng 2 chiều)
    recentActivities: List[str]
    payrollRows: List[Dict[str, Any]]
    
    # 2. BỔ SUNG TRƯỜNG NÀY ĐỂ API TRẢ VỀ DỮ LIỆU BIỂU ĐỒ
    salaryTrend: List[SalaryTrendItem] = []