from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from config.mysql import get_db
from modules.Position.Position_controller import PositionController
from modules.Position.Position_service import PositionService
from modules.Position.Position_schema import PositionCreate, PositionUpdate, PositionResponse
from typing import Optional

router = APIRouter(prefix="/positions", tags=["positions"])

def get_controller(db: Session = Depends(get_db)):
    service = PositionService(db)
    return PositionController(service)

@router.get("/", response_model=list[PositionResponse])
def get_all(
    department_id: Optional[int] = Query(None, description="Lọc theo phòng ban"),
    ctrl: PositionController = Depends(get_controller)
):
    return ctrl.get_all(department_id)

@router.get("/{pos_id}", response_model=PositionResponse)
def get_position(pos_id: int, ctrl: PositionController = Depends(get_controller)):
    return ctrl.get_by_id(pos_id)

@router.post("/", response_model=PositionResponse, status_code=201)
def create_position(data: PositionCreate, ctrl: PositionController = Depends(get_controller)):
    return ctrl.create(data)

@router.put("/{pos_id}", response_model=PositionResponse)
def update_position(pos_id: int, data: PositionUpdate, ctrl: PositionController = Depends(get_controller)):
    return ctrl.update(pos_id, data)

@router.delete("/{pos_id}")
def delete_position(pos_id: int, ctrl: PositionController = Depends(get_controller)):
    return ctrl.delete(pos_id)