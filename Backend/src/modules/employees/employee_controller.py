# src/modules/employees/employee_controller.py
"""
Employee Controller - Điều phối giữa Route và Service
"""

from .employee_service import get_employee_list
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