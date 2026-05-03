# src/modules/employees/employee_service.py
from .employee_repository import get_human_data, get_payroll_data, get_salary_data

def get_employee_list(dept=None, role=None):
    human = get_human_data()
    payroll = get_payroll_data()
    salary = get_salary_data()
    

    payroll_map = {str(p["id"]): p for p in payroll}
    salary_map = {str(s["id"]): s["salary"] for s in salary}   # alias salary trong SQL

    result = []
    for h in human:
        if dept and h["dept"] != dept:
            continue
        if role and h["role"] != role:
            continue

        p = payroll_map.get(str(h["id"]), {})
        base_salary = salary_map.get(str(h["id"]), None)

        result.append({
            "id": h["id"],
            "name": h["name"],
            "dept": h["dept"],
            "role": h["role"],
            "email": h["email"],
            "phone": h["phone"],
            "status": p.get("status"),      # từ payroll
            "salary": base_salary,          # từ salary map
        })
    print("Payroll data:", payroll[:2])
    print("Salary data:", salary[:2])
    return result
