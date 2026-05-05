try:
    from .employee_cors import setup_employee_cors
except Exception:
    setup_employee_cors = None
