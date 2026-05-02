from sqlalchemy.orm import Session
from modules.Position.Position_repository import PositionRepository
from modules.Position.Position_model import Position
from modules.Position.Position_schema import PositionCreate, PositionUpdate, PositionResponse
from modules.Department.Department_repository import DepartmentRepository
from modules.employee.Employee_repository import EmployeeRepository

class PositionService:
    def __init__(self, db: Session):
        self.repo = PositionRepository(db)
        self.dept_repo = DepartmentRepository(db)
        self.emp_repo = EmployeeRepository(db)

    def get_all(self, department_id: int = None) -> list[PositionResponse]:
        if department_id:
            positions = self.repo.get_by_department(department_id)
        else:
            positions = self.repo.get_all()
        result = []
        for p in positions:
            result.append(PositionResponse(
                id=p.id,
                title=p.title,
                description=p.description,
                department_id=p.department_id,
                department_name=p.department.name if p.department else None,
                synced_at=p.synced_at
            ))
        return result

    def get_by_id(self, pos_id: int) -> PositionResponse | None:
        p = self.repo.get_by_id(pos_id)
        if not p:
            return None
        return PositionResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            department_id=p.department_id,
            department_name=p.department.name if p.department else None,
            synced_at=p.synced_at
        )

    def create(self, data: PositionCreate) -> PositionResponse:
        if data.department_id:
            dept = self.dept_repo.get_by_id(data.department_id)
            if not dept:
                raise ValueError("Phòng ban không tồn tại")
        new_pos = Position(title=data.title, description=data.description, department_id=data.department_id)
        created = self.repo.create(new_pos)
        return self.get_by_id(created.id)

    def update(self, pos_id: int, data: PositionUpdate) -> PositionResponse:
        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return self.get_by_id(pos_id)
        if "department_id" in update_dict and update_dict["department_id"]:
            dept = self.dept_repo.get_by_id(update_dict["department_id"])
            if not dept:
                raise ValueError("Phòng ban không tồn tại")
        updated = self.repo.update(pos_id, update_dict)
        if not updated:
            raise ValueError("Chức vụ không tồn tại")
        return self.get_by_id(pos_id)

    def delete(self, pos_id: int) -> bool:
        if self.emp_repo.count_by_position(pos_id) > 0:
            raise ValueError("Không thể xóa chức vụ vì có nhân viên đang đảm nhận")
        return self.repo.delete(pos_id)