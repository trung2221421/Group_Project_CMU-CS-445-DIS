from src.modules.Position.Position_schema import PositionCreate, PositionUpdate
from src.modules.Position.Position_service import PositionService


class PositionController:
    def __init__(self, service: PositionService):
        self.service = service

    def get_all(self, department_id=None):
        return self.service.get_all(department_id)

    def get_by_id(self, pos_id: int):
        return self.service.get_by_id(pos_id)

    def create(self, data: PositionCreate):
        return self.service.create(data)

    def update(self, pos_id: int, data: PositionUpdate):
        return self.service.update(pos_id, data)

    def delete(self, pos_id: int):
        return self.service.delete(pos_id)
