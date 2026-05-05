from fastapi import APIRouter, Depends, HTTPException
import logging

from src.modules.Department.Department_controller import DepartmentController
from src.modules.Department.Department_schema import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from src.modules.Department.Department_service import DepartmentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/departments", tags=["Departments"])


def get_controller():
    return DepartmentController(DepartmentService())


@router.get("/", response_model=list[DepartmentResponse])
def get_all(ctrl: DepartmentController = Depends(get_controller)):
    try:
        return ctrl.get_all()
    except Exception as exc:
        logger.exception("Lỗi tải danh sách phòng ban: %s", exc)
        raise HTTPException(status_code=500, detail="Không thể tải danh sách phòng ban")


@router.post("/", response_model=DepartmentResponse, status_code=201)
def create(data: DepartmentCreate, ctrl: DepartmentController = Depends(get_controller)):
    try:
        return ctrl.create(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Lỗi thêm phòng ban: %s", exc)
        raise HTTPException(status_code=500, detail="Không thể thêm phòng ban")


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update(dept_id: int, data: DepartmentUpdate, ctrl: DepartmentController = Depends(get_controller)):
    try:
        return ctrl.update(dept_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Lỗi cập nhật phòng ban: %s", exc)
        raise HTTPException(status_code=500, detail="Không thể cập nhật phòng ban")


@router.delete("/{dept_id}")
def delete(dept_id: int, ctrl: DepartmentController = Depends(get_controller)):
    try:
        return ctrl.delete(dept_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Lỗi xóa phòng ban: %s", exc)
        raise HTTPException(status_code=500, detail="Không thể xóa phòng ban")