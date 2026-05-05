from fastapi import FastAPI
from src.modules.payroll.payroll_route import router as payroll_router
from src.modules.attendance.attendance_route import router as attendance_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.include_router(payroll_router)
app.include_router(attendance_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev thì dùng *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)