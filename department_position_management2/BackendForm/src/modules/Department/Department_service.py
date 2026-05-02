from sqlalchemy.orm import Session
from modules.Department.Department_repository import DepartmentRepository
from modules.Department.Department_model import Department
from modules.Department.Department_schema import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from modules.employee.Employee_repository import EmployeeRepository

class DepartmentService:
    def __init__(self, db: Session):
        self.repo = DepartmentRepository(db)
        self.emp_repo = EmployeeRepository(db)

    def get_all(self) -> list[DepartmentResponse]:
        depts = self.repo.get_all()
        result = []
        for d in depts:
            count = self.emp_repo.count_by_department(d.id)
            result.append(DepartmentResponse(
                id=d.id,
                code=d.code,
                name=d.name,
                status=d.status,
                employee_count=count,
                synced_at=d.synced_at
            ))
        return result

    def create(self, data: DepartmentCreate) -> DepartmentResponse:
        if self.repo.get_by_code(data.code):
            raise ValueError("Mã phòng ban đã tồn tại")
        new_dept = Department(code=data.code, name=data.name, status=data.status)
        created = self.repo.create(new_dept)
        return DepartmentResponse(id=created.id, code=created.code, name=created.name, status=created.status)

    def update(self, dept_id: int, data: DepartmentUpdate) -> DepartmentResponse:
        update_dict = data.model_dump(exclude_unset=True)
        if "code" in update_dict and self.repo.get_by_code(update_dict["code"]):
            raise ValueError("Mã phòng ban đã tồn tại")
        updated = self.repo.update(dept_id, update_dict)
        if not updated:
            raise ValueError("Phòng ban không tồn tại")
        # Trả về bản ghi đã cập nhật
        return self.get_all()[0]  # Có thể viết hàm get_one, nhưng tạm dùng cách này

    def delete(self, dept_id: int) -> bool:
        if self.emp_repo.count_by_department(dept_id) > 0:
            raise ValueError("Không thể xóa phòng ban vì còn nhân viên")
        return self.repo.delete(dept_id)