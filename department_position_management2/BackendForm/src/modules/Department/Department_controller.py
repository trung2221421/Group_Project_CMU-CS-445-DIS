from fastapi import HTTPException
from modules.Department.Department_service import DepartmentService
from modules.Department.Department_schema import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from typing import List

class DepartmentController:
    def __init__(self, service: DepartmentService):
        self.service = service

    def get_all(self) -> List[DepartmentResponse]:
        return self.service.get_all()

    def create(self, data: DepartmentCreate) -> DepartmentResponse:
        try:
            return self.service.create(data)
        except ValueError as e:
            raise HTTPException(400, str(e))

    def update(self, dept_id: int, data: DepartmentUpdate) -> DepartmentResponse:
        try:
            return self.service.update(dept_id, data)
        except ValueError as e:
            raise HTTPException(400, str(e))

    def delete(self, dept_id: int):
        try:
            if not self.service.delete(dept_id):
                raise HTTPException(404, "Not found")
            return {"message": "Deleted"}
        except ValueError as e:
            raise HTTPException(400, str(e))