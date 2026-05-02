#employee_service.py
from .employee_repository import get_human_data, get_payroll_data

def get_employee_list(dept=None, role=None):
    human   = get_human_data()
    payroll = get_payroll_data()
    payroll_map = {str(p["id"]): p for p in payroll}

    result = []
    for h in human:
        if dept and h["dept"] != dept:   # ← filter ở đây
            continue
        if role and h["role"] != role:
            continue

        p = payroll_map.get(str(h["id"]), {})
        result.append({
            "id":    h["id"],
            "name":  h["name"],
            "dept":  h["dept"],
            "role":  h["role"],
            "email": h["email"],
            "phone": h["phone"],
            "status": p.get("Status"),   # ← đổi sang cột thực có trong DB
        })
    return result
