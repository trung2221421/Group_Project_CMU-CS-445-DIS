# src/middlewares/__init__.py
from .cors_middleware import setup_cors
from .employee_cors import setup_employee_cors

__all__ = ["setup_cors", "setup_employee_cors"]