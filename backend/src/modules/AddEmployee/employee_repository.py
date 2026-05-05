from src.config.HUMAN_sqlserver import get_sqlserver_connection
from src.config.payroll_mysql import get_mysql_connection

def get_department_by_id(dept_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments WHERE DepartmentID = ?", dept_id)
        row = cursor.fetchone()
        return {"id": row[0], "name": row[1]} if row else None
    finally:
        conn.close()

def get_position_by_id(pos_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT PositionID, PositionName FROM Positions WHERE PositionID = ?", pos_id)
        row = cursor.fetchone()
        return {"id": row[0], "name": row[1]} if row else None
    finally:
        conn.close()

def insert_employee(data: dict) -> int:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO employees (FullName, email, PhoneNumber, DateOfBirth, Gender, HireDate, DepartmentID, PositionID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['name'], data.get('email'), data.get('phone'),
            data.get('date_of_birth'), data.get('gender'),
            data.get('hire_date'), data.get('department_id'), data.get('position_id')
        ))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        return cursor.fetchone()[0]
    finally:
        conn.close()

def update_employee(emp_id: int, data: dict):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE employees
            SET FullName = ?, email = ?, PhoneNumber = ?, DateOfBirth = ?, Gender = ?, HireDate = ?, DepartmentID = ?, PositionID = ?
            WHERE EmployeeID = ?
        """, (
            data.get('name'), data.get('email'), data.get('phone'),
            data.get('date_of_birth'), data.get('gender'),
            data.get('hire_date'), data.get('department_id'), data.get('position_id'),
            emp_id
        ))
        conn.commit()
    finally:
        conn.close()

def insert_payroll_employee(emp_id: int, data: dict, status: str = 'Active'):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (%s, %s, %s, %s, %s)
        """, (emp_id, data['name'], data.get('department_id'), data.get('position_id'), status))
        conn.commit()
    finally:
        conn.close()


def update_payroll_employee(emp_id: int, status: str):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE employees_payroll SET Status = %s WHERE EmployeeID = %s",
                       (status, emp_id))
        conn.commit()
    finally:
        conn.close()
# src/modules/employee/employee_repository.py
def check_email_exists(email: str) -> bool:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM employees WHERE Email = ?", (email,))
        return cursor.fetchone() is not None
    finally:
        conn.close()