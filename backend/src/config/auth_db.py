import os
from contextlib import contextmanager

import pymysql
from dotenv import load_dotenv

load_dotenv()


def get_auth_connection():
    return pymysql.connect(
        host=os.getenv("AUTH_DB_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        port=int(os.getenv("AUTH_DB_PORT", os.getenv("MYSQL_PORT", "3306"))),
        user=os.getenv("AUTH_DB_USER", os.getenv("MYSQL_USER", "root")),
        password=os.getenv("AUTH_DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "Trung")),
        database=os.getenv("AUTH_DB_NAME", "dashboard_integration"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        charset="utf8mb4",
    )


@contextmanager
def auth_cursor(commit: bool = False):
    conn = get_auth_connection()
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


def init_auth_tables():
    """Create Dashboard-owned auth/audit tables if they do not exist."""
    with auth_cursor(commit=True) as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                AuditLogID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                UserID INT NULL,
                Username VARCHAR(100) NULL DEFAULT 'system',
                RoleName VARCHAR(100) NULL DEFAULT 'system',
                Action VARCHAR(100) NOT NULL,
                Module VARCHAR(100) NOT NULL,
                TargetID VARCHAR(100) NULL,
                Detail TEXT NULL,
                OldValue JSON NULL,
                NewValue JSON NULL,
                IPAddress VARCHAR(45) NULL,
                Status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
                CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                NotificationID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                Type VARCHAR(50) NOT NULL,
                Level VARCHAR(30) NOT NULL DEFAULT 'LOW',
                Title VARCHAR(255) NOT NULL,
                Content TEXT NULL,
                EmployeeID INT NULL,
                IsRead TINYINT(1) NOT NULL DEFAULT 0,
                Status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sync_logs (
                SyncLogID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                EntityType VARCHAR(50) NOT NULL,
                EntityID VARCHAR(100) NULL,
                Action VARCHAR(100) NOT NULL,
                Status VARCHAR(50) NOT NULL,
                Message TEXT NULL,
                RetryCount INT NOT NULL DEFAULT 0,
                CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
