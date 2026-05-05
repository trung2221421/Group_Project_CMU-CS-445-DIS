import os
from contextlib import contextmanager

import pyodbc
from dotenv import load_dotenv

load_dotenv()


def _build_connection_string() -> str:
    explicit = os.getenv("SQLSERVER_CONNECTION_STRING")
    if explicit:
        return explicit

    driver = os.getenv("SQLSERVER_DRIVER", "ODBC Driver 18 for SQL Server")

    server = os.getenv("SQLSERVER_HOST", r"DESKTOP-DHT\SQLEXPRESS")
    database = os.getenv("SQLSERVER_DATABASE", "HUMAN_2025")  # để trống nếu dùng <default>

    user = os.getenv("SQLSERVER_USER", "sa")
    password = os.getenv("SQLSERVER_PASSWORD", "12345")

    trusted = os.getenv("SQLSERVER_TRUSTED_CONNECTION", "false").lower() in {
        "1", "true", "yes"
    }

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        "Encrypt=yes",
        "TrustServerCertificate=yes",
    ]

    if database:
        parts.append(f"DATABASE={database}")

    if trusted:
        parts.append("Trusted_Connection=yes")
    else:
        parts.extend([
            f"UID={user}",
            f"PWD={password}",
        ])

    return ";".join(parts) + ";"


def get_sqlserver_connection():
    return pyodbc.connect(_build_connection_string())


@contextmanager
def sqlserver_cursor(commit: bool = False):
    conn = get_sqlserver_connection()
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


def get_sqlserver_db():
    conn = get_sqlserver_connection()
    try:
        yield conn
    finally:
        conn.close()


try:
    from sqlalchemy.orm import declarative_base
    BaseSqlServer = declarative_base()
except Exception:
    BaseSqlServer = object