import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def get_sqlserver_connection():
    host = os.getenv("SQLSERVER_HOST")
    port = os.getenv("SQLSERVER_PORT")
    db = os.getenv("SQLSERVER_DB")
    user = os.getenv("SQLSERVER_USER")
    password = os.getenv("SQLSERVER_PASSWORD")

    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={host},{port};"
        f"DATABASE={db};"
        f"UID={user};"
        f"PWD={password}"
    )