import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def get_sqlserver_connection():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={os.getenv('SQLSERVER_HOST')};"
        f"DATABASE={os.getenv('SQLSERVER_DB')};"
        f"UID={os.getenv('SQLSERVER_USER')};"
        f"PWD={os.getenv('SQLSERVER_PASSWORD')}"
    )