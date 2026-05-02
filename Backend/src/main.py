import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.stdout.reconfigure(encoding='utf-8')

from fastapi import FastAPI
from src.middlewares.cors_middleware import setup_cors

# Import cả hai router
from src.modules.employees.employee_route import router as employees_router  # GET /, GET /filters
from src.modules.employee.employee_route import router as employee_router   # POST /, PUT /{id}

app = FastAPI(
    title="HR Management System",
    description="API cho hệ thống quản lý nhân sự",
    version="1.0.0"
)

setup_cors(app)

# Mount cả hai router với cùng prefix
app.include_router(employees_router, prefix="/api/employees", tags=["Employees"])
app.include_router(employee_router, prefix="/api/employees", tags=["Employees"])

# Health check
@app.get("/")
async def root():
    return {
        "message": "HR Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "employees": "/api/employees",
            "employee_filters": "/api/employees/filters"
        }
    }

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("🚀 Ứng dụng đã khởi động!")
    print("="*50)
    print("\n📋 Danh sách API endpoints:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            print(f"   {methods:20} {route.path}")
    print("\n" + "="*50 + "\n")