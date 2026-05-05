# src/modules/Accounts/account_repository.py
from src.config.sqlserver import get_sqlserver_connection

def get_user_by_username(username: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Users WHERE UserName = ?", username)
        row = cursor.fetchone()
        if row:
            columns = [col[0] for col in cursor.description]
            return dict(zip(columns, row))
        return None
    finally:
        conn.close()

def get_user_by_employee_id(emp_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Users WHERE EmployeeID = ?", emp_id)
        row = cursor.fetchone()
        if row:
            columns = [col[0] for col in cursor.description]
            return dict(zip(columns, row))
        return None
    finally:
        conn.close()

def create_user(username: str, full_name: str, email: str, password_hash: str, employee_id: int) -> int:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Users (UserName, FullName, Email, PasswordHash, IsActive, CreatedAt, EmployeeID)
            VALUES (?, ?, ?, ?, 1, GETDATE(), ?)
        """, (username, full_name, email, password_hash, employee_id))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        return cursor.fetchone()[0]
    finally:
        conn.close()

def update_user_password(user_id: int, password_hash: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Users SET PasswordHash = ? WHERE UserID = ?", (password_hash, user_id))
        conn.commit()
    finally:
        conn.close()

def deactivate_user_by_employee(emp_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Users SET IsActive = 0 WHERE EmployeeID = ?", (emp_id,))
        conn.commit()
    finally:
        conn.close()

def delete_user_by_employee(emp_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM User_Role WHERE UserID IN (SELECT UserID FROM Users WHERE EmployeeID = ?)", (emp_id,))
        cursor.execute("DELETE FROM Users WHERE EmployeeID = ?", (emp_id,))
        conn.commit()
    finally:
        conn.close()