from .employee_service import get_employee_list, get_employee_by_id as service_get_employee_by_id, delete_employee_from_service
from . import employee_repository

def get_filter_options():
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
    try:
        return get_employee_list(dept, role)
    except Exception as e:
        print(f"❌ Error getting employees: {e}")
        return []

def get_single_employee(emp_id):
    return service_get_employee_by_id(emp_id)

def delete_employee(emp_id: int):
    # Không cần user nữa
    try:
        return delete_employee_from_service(emp_id)
    except PermissionError as e:
        raise PermissionError(str(e))
    except Exception as e:
        raise Exception(f"Lỗi server: {str(e)}")