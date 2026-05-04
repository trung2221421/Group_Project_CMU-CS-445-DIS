# src/modules/employees/employee_controller.py
"""
Employee Controller - Điều phối giữa Route và Service
"""

from .employee_service import get_employee_list, get_employee_by_id as service_get_employee_by_id
from . import employee_repository


def get_filter_options():
    """
    Lấy danh sách departments và roles cho bộ lọc
    """
    try:
        return {
            "departments": employee_repository.get_departments(),
            "roles": employee_repository.get_roles(),
        }
    except Exception as e:
        print(f"❌ Error getting filter options: {e}")
        return {
            "departments": [],
            "roles": []
        }


def get_employees(dept: str = None, role: str = None):
    """
    Lấy danh sách nhân viên với optional filter
    """
    try:
        return get_employee_list(dept, role)
    except Exception as e:
        print(f"❌ Error getting employees: {e}")
        return []

def get_single_employee(emp_id):
    return service_get_employee_by_id(emp_id)

from .employee_service import delete_employee as service_delete_employee

def delete_employee(emp_id: int, user: dict):
    try:
        return service_delete_employee(emp_id, user)
    except PermissionError as e:
        raise PermissionError(str(e))
    except Exception as e:
        raise Exception(f"Lỗi server: {str(e)}")