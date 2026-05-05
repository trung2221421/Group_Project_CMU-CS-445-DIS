import os
from contextlib import contextmanager

import pymysql
from dotenv import load_dotenv

load_dotenv()


def get_mysql_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", "Trung"),
        database=os.getenv("MYSQL_DATABASE", "payroll_2026"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        charset="utf8mb4",
    )


@contextmanager
def mysql_cursor(commit: bool = False):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        if commit:
            conn.rollback()
        raise
    finally:
        conn.close()


# Backward-compatible aliases for old code paths.
def get_mysql_db():
    conn = get_mysql_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_db():
    yield from get_mysql_db()


try:
    from sqlalchemy.orm import declarative_base
    BaseMysql = declarative_base()
    Base = BaseMysql
except Exception:  # SQLAlchemy is optional for current raw-SQL implementation.
    BaseMysql = object
    Base = object
