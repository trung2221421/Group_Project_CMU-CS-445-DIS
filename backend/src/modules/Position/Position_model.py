from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from src.config.mysql import Base

class Position(Base):
    __tablename__ = "positions_payroll"

    id = Column("PositionID", Integer, primary_key=True, index=True)
    title = Column("PositionName", String(100), nullable=False)
    description = Column("Description", String(255), nullable=True)
    department_id = Column("DepartmentID", Integer, ForeignKey("departments_payroll.DepartmentID", ondelete="SET NULL"))
    synced_at = Column("SyncedAt", DateTime, server_default=func.now())

    department = relationship("Department", back_populates="positions")
    employees = relationship("Employee", back_populates="position")