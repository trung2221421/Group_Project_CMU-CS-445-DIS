# src/controllers/employee_controller.py
from fastapi import APIRouter
from src.services.employee_service import get_employee_list

router = APIRouter()

@router.get("/employees")
def get_employees():
    return get_employee_list()