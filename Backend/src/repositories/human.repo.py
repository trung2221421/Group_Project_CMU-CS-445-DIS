# src/repositories/human_repo.py
from src.config.sqlserver import get_sqlserver_connection

def get_human_data():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, phone, dept, role FROM employees")

    columns = [col[0] for col in cursor.description]
    data = [dict(zip(columns, row)) for row in cursor.fetchall()]

    conn.close()
    return data