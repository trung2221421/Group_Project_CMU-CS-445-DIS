from pydantic import BaseModel
from typing import List, Dict, Any

class ReportStats(BaseModel):
    monthlyPayroll: str
    workDays: int
    leaveDays: int
    absentDays: int
    totalEmployees: int   # Thêm Tổng nhân viên
    maleCount: int        # Thêm Số lượng Nam
    femaleCount: int      # Thêm Số lượng Nữ

class DepartmentDataItem(BaseModel):
    name: str
    value: int

class DividendRow(BaseModel):
    id: str
    name: str
    dept: str
    amount: float
    date: str

class TopAbsentEmployee(BaseModel):
    id: str
    name: str
    dept: str
    absentCount: int
    reason: str

class SalaryTrendItem(BaseModel):
    month: str
    total: float

class AnalysisText(BaseModel):
    salaryText: str
    attendanceText: str
    employeeText: str     # Phân tích nhân sự
    dividendText: str     # Phân tích cổ tức

class MonthlyReportResponse(BaseModel):
    stats: ReportStats
    topAbsentEmployees: List[TopAbsentEmployee]
    salaryTrend: List[SalaryTrendItem]
    payrollRows: List[Dict[str, Any]]
    departmentData: List[DepartmentDataItem] # Dữ liệu cho DepartmentChart
    dividendsData: List[DividendRow]         # Bảng cổ tức
    analysis: AnalysisText