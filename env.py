# src/config/env.py
import os
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# --- Cấu hình SQL Server ---
SQLSERVER_HOST = os.getenv("SQLSERVER_HOST", r"(localdb)\MSSQLLocalDB")
SQLSERVER_DB = os.getenv("SQLSERVER_DB", "HUMAN_2025")

# --- Cấu hình MySQL ---
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "123456")
MYSQL_DB = os.getenv("MYSQL_DB", "payroll_2026")