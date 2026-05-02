from sqlalchemy.orm import Session
from modules.employee.Employee_model import Employee

class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def count_by_department(self, department_id: int) -> int:
        return self.db.query(Employee).filter(Employee.department_id == department_id).count()

    def count_by_position(self, position_id: int) -> int:
        return self.db.query(Employee).filter(Employee.position_id == position_id).count()