from sqlalchemy.orm import Session
from modules.Department.Department_model import Department
from typing import List, Optional

class DepartmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Department]:
        return self.db.query(Department).all()

    def get_by_id(self, dept_id: int) -> Optional[Department]:
        return self.db.query(Department).filter(Department.id == dept_id).first()

    def get_by_code(self, code: str) -> Optional[Department]:
        return self.db.query(Department).filter(Department.code == code).first()

    def create(self, dept: Department) -> Department:
        self.db.add(dept)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    def update(self, dept_id: int, data: dict) -> Optional[Department]:
        dept = self.get_by_id(dept_id)
        if not dept:
            return None
        for key, value in data.items():
            setattr(dept, key, value)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    def delete(self, dept_id: int) -> bool:
        dept = self.get_by_id(dept_id)
        if not dept:
            return False
        self.db.delete(dept)
        self.db.commit()
        return True