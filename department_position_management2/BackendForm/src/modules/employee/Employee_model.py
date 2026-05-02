from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from config.mysql import Base

class Employee(Base):
    __tablename__ = "employees_payroll"

    id = Column("EmployeeID", Integer, primary_key=True)
    full_name = Column("FullName", String(100))
    department_id = Column("DepartmentID", Integer, ForeignKey("departments_payroll.DepartmentID", ondelete="SET NULL"))
    position_id = Column("PositionID", Integer, ForeignKey("positions_payroll.PositionID", ondelete="SET NULL"))
    status = Column("Status", String(50))
    synced_at = Column("SyncedAt", DateTime, server_default=func.now())

    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")