from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.modules.dashboard.dashboard_route import router as dashboard_router
# BỔ SUNG: Import router của module reports
from src.modules.reports.reports_route import router as reports_router


app = FastAPI(title="Payroll Pro API")

# Cấu hình CORS để Frontend (React/Vite) có thể gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Thay thế "*" bằng URL của frontend (VD: "http://localhost:5173") khi lên Production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn các route của hệ thống
app.include_router(dashboard_router)
# BỔ SUNG: Gắn router của báo cáo vào ứng dụng
app.include_router(reports_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Payroll Pro API"}