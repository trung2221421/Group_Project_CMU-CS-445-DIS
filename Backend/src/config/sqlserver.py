# src/config/sqlserver.py
import pyodbc
from src.config.env import SQLSERVER_CONFIG

def get_sqlserver_connection():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SQLSERVER_CONFIG['server']};"
        f"DATABASE={SQLSERVER_CONFIG['database']};"
        f"UID={SQLSERVER_CONFIG['user']};"
        f"PWD={SQLSERVER_CONFIG['password']}"
    )