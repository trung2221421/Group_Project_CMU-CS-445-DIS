from sqlalchemy.orm import Session
from modules.Position.Position_model import Position
from typing import List, Optional

class PositionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Position]:
        return self.db.query(Position).offset(skip).limit(limit).all()

    def get_by_id(self, pos_id: int) -> Optional[Position]:
        return self.db.query(Position).filter(Position.id == pos_id).first()

    def get_by_department(self, department_id: int) -> List[Position]:
        return self.db.query(Position).filter(Position.department_id == department_id).all()

    def create(self, position: Position) -> Position:
        self.db.add(position)
        self.db.commit()
        self.db.refresh(position)
        return position

    def update(self, pos_id: int, data: dict) -> Optional[Position]:
        position = self.get_by_id(pos_id)
        if not position:
            return None
        for key, value in data.items():
            setattr(position, key, value)
        self.db.commit()
        self.db.refresh(position)
        return position

    def delete(self, pos_id: int) -> bool:
        position = self.get_by_id(pos_id)
        if not position:
            return False
        self.db.delete(position)
        self.db.commit()
        return True