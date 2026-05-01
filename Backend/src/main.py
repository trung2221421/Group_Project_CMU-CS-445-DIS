# src/main.py
from fastapi import FastAPI
from src.controller.employee_controller import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# fix CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")