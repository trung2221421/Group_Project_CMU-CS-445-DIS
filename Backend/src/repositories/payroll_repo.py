# src/repositories/payroll_repo.py
from src.config.mysql import get_mysql_connection

def get_payroll_data():
    conn = get_mysql_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT employee_id, salary, insurance FROM payroll")
    data = cursor.fetchall()

    conn.close()
    return data