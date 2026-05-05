from src.modules.Department.Department_schema import DepartmentCreate, DepartmentUpdate
from src.modules.Department.Department_service import DepartmentService


class DepartmentController:
    def __init__(self, service: DepartmentService):
        self.service = service

    def get_all(self):
        return self.service.get_all()

    def create(self, data: DepartmentCreate):
        return self.service.create(data)

    def update(self, dept_id: int, data: DepartmentUpdate):
        return self.service.update(dept_id, data)

    def delete(self, dept_id: int):
        return self.service.delete(dept_id)
