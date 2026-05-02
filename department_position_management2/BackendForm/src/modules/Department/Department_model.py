from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from config.mysql import Base

class Department(Base):
    __tablename__ = "departments_payroll"

    id = Column("DepartmentID", Integer, primary_key=True, index=True)
    code = Column("DepartmentCode", String(50), unique=True, nullable=False)
    name = Column("DepartmentName", String(100), nullable=False)
    status = Column("Status", String(20), default="Synced")
    synced_at = Column("SyncedAt", DateTime, server_default=func.now())

    employees = relationship("Employee", back_populates="department")
    positions = relationship("Position", back_populates="department")