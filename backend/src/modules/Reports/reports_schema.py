from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class ReportStats(BaseModel):
    monthlyPayroll: str
    workDays: int = 0
    leaveDays: int = 0
    absentDays: int = 0
    totalEmployees: int = 0
    maleCount: int = 0
    femaleCount: int = 0
    totalSalary: float = 0
    averageSalary: float = 0


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
    reason: Optional[str] = None
    note: Optional[str] = None


class SalaryTrendItem(BaseModel):
    month: int
    label: str
    value: float
    amount: float = 0
    total: float = 0
    payroll: float = 0


class PayrollRow(BaseModel):
    id: str
    name: str
    dept: str
    salary: float
    baseSalary: float = 0
    bonus: float = 0
    deductions: float = 0
    workDays: int = 0
    leaveDays: int = 0
    absentDays: int = 0
    status: str = "Chờ xử lý"


class AnalysisText(BaseModel):
    salaryText: str
    attendanceText: str
    employeeText: str
    dividendText: str


class MonthlyReportResponse(BaseModel):
    month: int
    year: int
    stats: ReportStats
    topAbsentEmployees: List[TopAbsentEmployee]
    salaryTrend: List[SalaryTrendItem]
    payrollRows: List[Dict[str, Any]]
    departmentData: List[DepartmentDataItem]
    dividendsData: List[DividendRow]
    analysis: AnalysisText