from ast import main
import asyncio
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from src.middlewares.cors_middleware import setup_cors
from src.modules.Employees.employee_route import router as employee_router
from src.modules.AddEmployee.employee_route import router as employee_write_router
from src.modules.Dashboard.dashboard_route import router as dashboard_router
from src.modules.Department.Department_route import router as department_router
from src.modules.Position.Position_route import router as position_router
from src.modules.audit.audit_route import router as audit_router
from src.modules.notifications.notification_route import router as notification_router
from src.modules.sync.sync_route import router as sync_router
from src.modules.Reports.reports_route import router as reports_router
from src.modules.auth.auth_route import router as auth_router
from src.modules.payroll.payroll_route import router as payroll_router
from src.modules.attendance.attendance_route import router as attendance_router
from src.modules.audit.audit_middleware import AuditLoggerMiddleware



app = FastAPI(
    title="HR Payroll Integration Dashboard API",
    description="API tích hợp HUMAN_2025 SQL Server và PAYROLL MySQL cho Dashboard.",
    version="1.0.0",
)

setup_cors(app)

app.add_middleware(AuditLoggerMiddleware)
app.include_router(auth_router)
app.include_router(employee_router, prefix="/api/employees", tags=["Employees"])
app.include_router(employee_write_router, prefix="/api/employees", tags=["Employees"])

app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(department_router, prefix="/api", tags=["Departments"])
app.include_router(position_router, prefix="/api", tags=["Positions"])
app.include_router(sync_router, prefix="/api/sync", tags=["Sync"])
app.include_router(audit_router, prefix="/api/audit-logs", tags=["Audit Logs"])
app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(payroll_router, prefix="/api", tags=["Payroll"])
app.include_router(attendance_router, prefix="/api", tags=["Attendance"])
app.include_router(employee_write_router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {
        "message": "HR Payroll Integration Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth_login": "/api/auth/login",
            "auth_me": "/api/auth/me",
            "employees": "/api/employees",
            "employee_filters": "/api/employees/filters",
            "departments": "/api/departments",
            "positions": "/api/positions",
            "dashboard_summary": "/api/v1/dashboard/summary",
            "sync": "/api/sync/all",
            "sync_logs": "/api/sync/logs",
            "audit_logs": "/api/audit-logs",
            "notifications": "/api/notifications",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    try:
        from src.config.auth_db import init_auth_tables

        init_auth_tables()
        print("Auth/audit tables checked successfully.")
    except Exception as exc:
        print(f"Warning: could not initialize auth DB tables: {exc}")

    print("\nRegistered API endpoints:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(sorted(route.methods))
            print(f"{methods:20} {route.path}")