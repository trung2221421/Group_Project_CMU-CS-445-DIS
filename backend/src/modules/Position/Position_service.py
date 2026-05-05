from fastapi import HTTPException

from src.modules.Position.Position_repository import (
    count_employees_by_position,
    create_position,
    delete_position,
    get_all_positions,
    get_position_by_id,
    get_position_by_name,
    update_position,
)
from src.modules.Position.Position_schema import PositionCreate, PositionResponse, PositionUpdate
from src.modules.audit.audit_service import log_action
from src.modules.sync.sync_repository import upsert_payroll_position


def _to_response(row: dict) -> PositionResponse:
    return PositionResponse(
        id=row["PositionID"],
        title=row.get("PositionName"),
        description=None,
        department_id=None,
        department_name=None,
        synced_at=row.get("UpdatedAt") or row.get("CreatedAt"),
    )


class PositionService:
    def get_all(self, department_id: int | None = None) -> list[PositionResponse]:
        # HUMAN_2025 Positions are global and do not contain DepartmentID.
        return [_to_response(row) for row in get_all_positions()]

    def get_by_id(self, pos_id: int) -> PositionResponse | None:
        row = get_position_by_id(pos_id)
        return _to_response(row) if row else None
    
    def create(self, data: PositionCreate) -> PositionResponse:
        if get_position_by_name(data.title):
            raise ValueError("Tên chức vụ đã tồn tại")
        row = create_position(data.title)
        upsert_payroll_position({"PositionID": row["PositionID"], "PositionName": row["PositionName"]})
        log_action("CREATE", "Position", f"Created position {data.title}", target_id=row["PositionID"])
        return _to_response(row)

    def update(self, pos_id: int, data: PositionUpdate) -> PositionResponse:
        current = get_position_by_id(pos_id)
        if not current:
            raise ValueError("Chức vụ không tồn tại")
        name = data.title or current["PositionName"]
        duplicate = get_position_by_name(name)
        if duplicate and duplicate["PositionID"] != pos_id:
            raise ValueError("Tên chức vụ đã tồn tại")
        row = update_position(pos_id, name)
        upsert_payroll_position({"PositionID": row["PositionID"], "PositionName": row["PositionName"]})
        log_action("UPDATE", "Position", f"Updated position {pos_id}", target_id=pos_id, old_value=current, new_value=row)
        return _to_response(row)

    def delete(self, pos_id: int) -> dict:
        if count_employees_by_position(pos_id) > 0:
            raise ValueError("Không thể xóa chức vụ vì có nhân viên đang đảm nhận")
        if not delete_position(pos_id):
            raise ValueError("Chức vụ không tồn tại")
        log_action("DELETE", "Position", f"Deleted position {pos_id}", target_id=pos_id)
        return {"message": "Xóa chức vụ thành công"}
