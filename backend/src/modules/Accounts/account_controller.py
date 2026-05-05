# src/modules/Accounts/account_controller.py
from .account_service import register_account, disable_account_by_employee, remove_account_by_employee

def create_account(username: str, password: str, employee_id: int, full_name: str, email: str = None):
    try:
        return register_account(username, password, employee_id, full_name, email)
    except ValueError as e:
        raise ValueError(str(e))

def deactivate_account(emp_id: int):
    return disable_account_by_employee(emp_id)

def delete_account(emp_id: int):
    return remove_account_by_employee(emp_id)