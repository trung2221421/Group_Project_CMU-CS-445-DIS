from fastapi import HTTPException
from modules.Position.Position_service import PositionService
from modules.Position.Position_schema import PositionCreate, PositionUpdate, PositionResponse
from typing import List, Optional

class PositionController:
    def __init__(self, service: PositionService):
        self.service = service

    def get_all(self, department_id: Optional[int] = None) -> List[PositionResponse]:
        return self.service.get_all(department_id)

    def get_by_id(self, pos_id: int) -> PositionResponse:
        pos = self.service.get_by_id(pos_id)
        if not pos:
            raise HTTPException(404, "Chức vụ không tồn tại")
        return pos

    def create(self, data: PositionCreate) -> PositionResponse:
        try:
            return self.service.create(data)
        except ValueError as e:
            raise HTTPException(400, str(e))

    def update(self, pos_id: int, data: PositionUpdate) -> PositionResponse:
        try:
            return self.service.update(pos_id, data)
        except ValueError as e:
            raise HTTPException(400 if "tồn tại" in str(e) else 404, str(e))

    def delete(self, pos_id: int):
        try:
            if not self.service.delete(pos_id):
                raise HTTPException(404, "Chức vụ không tồn tại")
            return {"message": "Xóa thành công"}
        except ValueError as e:
            raise HTTPException(400, str(e))