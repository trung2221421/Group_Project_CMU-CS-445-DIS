from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.modules.Position.Position_controller import PositionController
from src.modules.Position.Position_schema import PositionCreate, PositionResponse, PositionUpdate
from src.modules.Position.Position_service import PositionService

router = APIRouter(prefix="/positions", tags=["Positions"])


def get_controller():
    return PositionController(PositionService())


@router.get("/", response_model=list[PositionResponse])
def get_all(
    department_id: Optional[int] = Query(None, description="Không dùng với schema HUMAN_2025 hiện tại"),
    ctrl: PositionController = Depends(get_controller),
):
    return ctrl.get_all(department_id)


@router.get("/{pos_id}", response_model=PositionResponse)
def get_position(pos_id: int, ctrl: PositionController = Depends(get_controller)):
    result = ctrl.get_by_id(pos_id)
    if not result:
        raise HTTPException(status_code=404, detail="Chức vụ không tồn tại")
    return result


@router.post("/", response_model=PositionResponse, status_code=201)
def create_position(data: PositionCreate, ctrl: PositionController = Depends(get_controller)):
    try:
        return ctrl.create(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{pos_id}", response_model=PositionResponse)
def update_position(pos_id: int, data: PositionUpdate, ctrl: PositionController = Depends(get_controller)):
    try:
        return ctrl.update(pos_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{pos_id}")
def delete_position(pos_id: int, ctrl: PositionController = Depends(get_controller)):
    try:
        return ctrl.delete(pos_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
