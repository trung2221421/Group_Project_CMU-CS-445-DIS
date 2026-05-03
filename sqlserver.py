# src/config/sqlserver.py
import urllib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from src.config.env import SQLSERVER_HOST, SQLSERVER_DB

# Tạo chuỗi kết nối sử dụng pyodbc
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={SQLSERVER_HOST};"
    f"DATABASE={SQLSERVER_DB};"
    f"Trusted_Connection=yes;"
)

SQLSERVER_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

# Khởi tạo Engine và Session
engine_sqlserver = create_engine(SQLSERVER_DATABASE_URL, pool_pre_ping=True)
SessionLocalSqlServer = sessionmaker(autocommit=False, autoflush=False, bind=engine_sqlserver)

BaseSqlServer = declarative_base()

# Dependency để lấy DB Session (Dùng cho FastAPI route)
def get_sqlserver_db():
    db = SessionLocalSqlServer()
    try:
        yield db
    finally:
        db.close()