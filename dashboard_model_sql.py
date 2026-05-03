# src/modules/dashboard/dashboard_model_sql.py
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
from src.config.sqlserver import BaseSqlServer

class Department(BaseSqlServer):
    __tablename__ = "Departments"
    DepartmentID = Column(Integer, primary_key=True)
    DepartmentName = Column(String)
    employees = relationship("Employee", back_populates="department")

class Position(BaseSqlServer):
    __tablename__ = "Positions"
    PositionID = Column(Integer, primary_key=True)
    PositionName = Column(String)
    employees = relationship("Employee", back_populates="position")

class Employee(BaseSqlServer):
    __tablename__ = "Employees"
    EmployeeID = Column(Integer, primary_key=True)
    FullName = Column(String)
    DateOfBirth = Column(Date)
    Gender = Column(String)
    PhoneNumber = Column(String)
    Email = Column(String)
    HireDate = Column(Date)
    DepartmentID = Column(Integer, ForeignKey("Departments.DepartmentID"))
    PositionID = Column(Integer, ForeignKey("Positions.PositionID"))
    Status = Column(String)
    
    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    dividends = relationship("Dividend", back_populates="employee")

class Dividend(BaseSqlServer):
    __tablename__ = "Dividends"
    DividendID = Column(Integer, primary_key=True)
    EmployeeID = Column(Integer, ForeignKey("Employees.EmployeeID"))
    DividendAmount = Column(Numeric(18, 2))
    DividendDate = Column(Date)
    
    employee = relationship("Employee", back_populates="dividends")