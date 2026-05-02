# main.py
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.stdout.reconfigure(encoding='utf-8')
from fastapi import FastAPI
from src.middlewares.cors_middleware import setup_cors
from src.modules.employees.employee_route import router as employee_router

# Khởi tạo FastAPI app
app = FastAPI(
    title="HR Management System",
    description="API cho hệ thống quản lý nhân sự",
    version="1.0.0"
)

# ✅ Setup CORS chung cho toàn bộ app
setup_cors(app)

# ✅ Setup CORS riêng cho Employee module (tùy chọn)
# Chỉ enable nếu cần rules đặc biệt cho employee endpoints
# setup_employee_cors(app)

# Import và mount routers
from src.modules.employees.employee_route import router as employee_router

# Mount employee router với prefix
app.include_router(
    employee_router, 
    prefix="/api/employees",
    tags=["Employees"]
)

# Health check endpoint
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

# Debug: In ra tất cả routes đã đăng ký
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
