import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.mysql import engine, Base
from modules.Department.Department_route import router as department_router
from modules.Position.Position_route import router as position_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HRM Payroll API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký router với prefix /api
app.include_router(department_router, prefix="/api")
app.include_router(position_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "HRM Payroll API running"}