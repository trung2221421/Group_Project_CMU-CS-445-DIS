# src/services/employee_service.py
from src.repositories.payroll_repo import get_payroll_data
from src.repositories.human_repo import get_human_data

def get_employee_list():
    payroll = get_payroll_data()
    human = get_human_data()

    payroll_map = {p["employee_id"]: p for p in payroll}

    result = []

    for h in human:
        p = payroll_map.get(h["id"], {})

        result.append({
            "id": h["id"],
            "name": h["name"],
            "dept": h["dept"],
            "role": h["role"],
            "email": h["email"],
            "phone": h["phone"],
            "salary": p.get("salary"),
            "insurance": p.get("insurance")
        })

    return result