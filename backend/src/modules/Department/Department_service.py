import logging

from src.modules.Department.Department_repository import (
    count_employees_by_department,
    create_department,
    delete_department,
    get_all_departments,
    get_department_by_id,
    get_department_by_name,
    update_department,
)
from src.modules.Department.Department_schema import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from src.modules.audit.audit_service import log_action
from src.modules.sync.sync_repository import upsert_payroll_department

logger = logging.getLogger(__name__)


def _to_response(row: dict, employee_count: int | None = None) -> DepartmentResponse:
    dept_id = row["DepartmentID"]
    return DepartmentResponse(
        id=dept_id,
        code=f"DEP{dept_id:03d}",
        name=row.get("DepartmentName"),
        status="Synced",
        employee_count=employee_count if employee_count is not None else row.get("EmployeeCount"),
        synced_at=row.get("UpdatedAt") or row.get("CreatedAt"),
    )


def _safe_sync_department(row: dict):
    try:
        upsert_payroll_department({
            "DepartmentID": row["DepartmentID"],
            "DepartmentName": row["DepartmentName"],
        })
    except Exception as exc:
        logger.exception("Không thể đồng bộ phòng ban sang Payroll: %s", exc)


def _safe_log_action(*args, **kwargs):
    try:
        log_action(*args, **kwargs)
    except Exception as exc:
        logger.exception("Không thể ghi audit log phòng ban: %s", exc)


class DepartmentService:
    def get_all(self) -> list[DepartmentResponse]:
        return [_to_response(row) for row in get_all_departments()]

    def create(self, data: DepartmentCreate) -> DepartmentResponse:
        if get_department_by_name(data.name):
            raise ValueError("Tên phòng ban đã tồn tại")

        row = create_department(data.name)

        _safe_sync_department(row)
        _safe_log_action(
            "CREATE",
            "Department",
            f"Thêm phòng ban {data.name}",
            target_id=row["DepartmentID"],
        )

        return _to_response(row, employee_count=0)

    def update(self, dept_id: int, data: DepartmentUpdate) -> DepartmentResponse:
        current = get_department_by_id(dept_id)
        if not current:
            raise ValueError("Phòng ban không tồn tại")

        name = data.name or current["DepartmentName"]

        duplicate = get_department_by_name(name)
        if duplicate and duplicate["DepartmentID"] != dept_id:
            raise ValueError("Tên phòng ban đã tồn tại")

        row = update_department(dept_id, name)
        if not row:
            raise ValueError("Phòng ban không tồn tại")

        _safe_sync_department(row)
        _safe_log_action(
            "UPDATE",
            "Department",
            f"Cập nhật phòng ban {current['DepartmentName']} thành {row['DepartmentName']}",
            target_id=dept_id,
            old_value=current,
            new_value=row,
        )

        return _to_response(row, employee_count=count_employees_by_department(dept_id))

    def delete(self, dept_id: int) -> dict:
        if count_employees_by_department(dept_id) > 0:
            raise ValueError("Không thể xóa phòng ban vì còn nhân viên")

        current = get_department_by_id(dept_id)
        if not current:
            raise ValueError("Phòng ban không tồn tại")

        if not delete_department(dept_id):
            raise ValueError("Phòng ban không tồn tại")

        _safe_log_action(
            "DELETE",
            "Department",
            f"Xóa phòng ban {current['DepartmentName']}",
            target_id=dept_id,
            old_value=current,
        )

        return {"message": "Xóa phòng ban thành công"}