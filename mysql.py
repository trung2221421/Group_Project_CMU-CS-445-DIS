# src/config/mysql.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from src.config.env import MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DB

# Tạo chuỗi kết nối MySQL
MYSQL_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# Khởi tạo Engine và Session
engine_mysql = create_engine(MYSQL_DATABASE_URL, pool_pre_ping=True)
SessionLocalMysql = sessionmaker(autocommit=False, autoflush=False, bind=engine_mysql)

BaseMysql = declarative_base()

# Dependency để lấy DB Session (Dùng cho FastAPI route)
def get_mysql_db():
    db = SessionLocalMysql()
    try:
        yield db
    finally:
        db.close()