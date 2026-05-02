from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.mysql import get_db
from modules.Department.Department_controller import DepartmentController
from modules.Department.Department_service import DepartmentService
from modules.Department.Department_schema import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["departments"])

def get_controller(db: Session = Depends(get_db)):
    service = DepartmentService(db)
    return DepartmentController(service)

@router.get("/", response_model=list[DepartmentResponse])
def get_all(ctrl: DepartmentController = Depends(get_controller)):
    return ctrl.get_all()

@router.post("/", response_model=DepartmentResponse, status_code=201)
def create(data: DepartmentCreate, ctrl: DepartmentController = Depends(get_controller)):
    return ctrl.create(data)

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update(dept_id: int, data: DepartmentUpdate, ctrl: DepartmentController = Depends(get_controller)):
    return ctrl.update(dept_id, data)

@router.delete("/{dept_id}")
def delete(dept_id: int, ctrl: DepartmentController = Depends(get_controller)):
    return ctrl.delete(dept_id)