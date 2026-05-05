# src/modules/employees/employee_service.py
from .employee_repository import get_human_data, get_payroll_data, get_salary_data, has_payroll_data

from src.config.auth import has_min_role, is_accountant
from .employee_repository import get_employee_payroll_info, delete_human_employee, delete_payroll_employee


def get_employee_list(dept=None, role=None):
    human = get_human_data()
    payroll = get_payroll_data()
    salary = get_salary_data()

    payroll_map = {str(p["id"]): p for p in payroll}
    salary_map = {str(s["id"]): s["salary"] for s in salary}

    result = []
    for h in human:
        if dept and h["dept"] != dept:
            continue
        if role and h["role"] != role:
            continue

        p = payroll_map.get(str(h["id"]), {})
        base_salary = salary_map.get(str(h["id"]), None)
        # Dùng has_payroll_data để kiểm tra đồng bộ chính xác
        synced = has_payroll_data(h["id"])
        sync_status = "Đã đồng bộ" if synced else "Chưa đồng bộ"

        result.append({
            "id": h["id"],
            "name": h["name"],
            "dept": h["dept"],
            "role": h["role"],
            "email": h["email"],
            "phone": h["phone"],
            "status": p.get("status"),
            "salary": base_salary,
            "date_of_birth": str(h.get("date_of_birth")) if h.get("date_of_birth") else "",
            "gender": h.get("gender", ""),
            "hire_date": str(h.get("hire_date")) if h.get("hire_date") else "",
            "department_id": h.get("department_id"),
            "position_id": h.get("position_id"),
            "sync_status": sync_status,
        })
    return result

def get_employee_by_id(emp_id: int):
    human = get_human_data()
    payroll = get_payroll_data()
    salary = get_salary_data()

    payroll_map = {str(p["id"]): p for p in payroll}
    salary_map = {str(s["id"]): s["salary"] for s in salary}

    for h in human:
        if int(h["id"]) == emp_id:
            p = payroll_map.get(str(h["id"]), {})
            base_salary = salary_map.get(str(h["id"]), None)
            synced = has_payroll_data(emp_id)
            sync_status = "Đã đồng bộ" if synced else "Chưa đồng bộ"
            return {
                "id": h["id"],
                "name": h["name"],
                # ... (giữ nguyên các trường khác)
                "sync_status": sync_status,
            }
    return None

def delete_employee(emp_id: int, user: dict):
    # Kiểm tra mọi dữ liệu payroll
    payroll_exists = has_payroll_data(emp_id)

    can_delete_human = False
    can_delete_payroll = False

    if is_accountant(user):
        can_delete_payroll = True
        if has_min_role(user, "truong_phong"):
            can_delete_human = True
    else:
        if has_min_role(user, "truong_phong"):
            if not payroll_exists:
                can_delete_human = True
            else:
                raise PermissionError("Không thể xóa nhân viên đã có dữ liệu payroll.")
        else:
            raise PermissionError("Bạn không có quyền xóa nhân viên.")

    if can_delete_human:
        delete_human_employee(emp_id)
    if can_delete_payroll:
        delete_payroll_employee(emp_id)

    return {"message": "Xóa thành công"}