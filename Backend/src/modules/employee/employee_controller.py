# src/modules/employee/employee_controller.py
from .employee_service import create_employee, update_employee_data

def add_employee(data: dict):
    return create_employee(data)

def edit_employee(emp_id: int, data: dict):
    return update_employee_data(emp_id, data)