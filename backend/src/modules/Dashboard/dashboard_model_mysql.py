from sqlalchemy import Column, Integer, String, ForeignKey, Date, DECIMAL
from sqlalchemy.orm import relationship
from src.config.payroll_mysql import BaseMysql

class DepartmentPayroll(BaseMysql):
    __tablename__ = "departments_payroll"
    DepartmentID = Column(Integer, primary_key=True)
    DepartmentName = Column(String)

class PositionPayroll(BaseMysql):
    __tablename__ = "positions_payroll"
    PositionID = Column(Integer, primary_key=True)
    PositionName = Column(String)

class EmployeePayroll(BaseMysql):
    __tablename__ = "employees_payroll"
    EmployeeID = Column(Integer, primary_key=True)
    FullName = Column(String)
    DepartmentID = Column(Integer)
    PositionID = Column(Integer)
    Status = Column(String)
    
    salaries = relationship("Salary", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")

class Attendance(BaseMysql):
    __tablename__ = "attendance"
    AttendanceID = Column(Integer, primary_key=True)
    EmployeeID = Column(Integer, ForeignKey("employees_payroll.EmployeeID"))
    WorkDays = Column(Integer)
    AbsentDays = Column(Integer)
    LeaveDays = Column(Integer)
    AttendanceMonth = Column(Date)
    
    employee = relationship("EmployeePayroll", back_populates="attendances")

class Salary(BaseMysql):
    __tablename__ = "salaries"
    SalaryID = Column(Integer, primary_key=True)
    EmployeeID = Column(Integer, ForeignKey("employees_payroll.EmployeeID"))
    SalaryMonth = Column(Date)
    BaseSalary = Column(DECIMAL(18, 2))
    Bonus = Column(DECIMAL(18, 2))
    Deductions = Column(DECIMAL(18, 2))
    NetSalary = Column(DECIMAL(18, 2))
    
    employee = relationship("EmployeePayroll", back_populates="salaries")