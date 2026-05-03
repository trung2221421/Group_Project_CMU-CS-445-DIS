# src/modules/employees/employee_repository.py
from src.config.mysql import get_mysql_connection
from src.config.sqlserver import get_sqlserver_connection

def get_human_data():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""SELECT 
            e.EmployeeID as id,
            e.FullName as name,
            e.email,
            e.PhoneNumber as phone,
            d.DepartmentName as dept,
            p.PositionName as role
        FROM employees e
        JOIN Departments d ON e.DepartmentID = d.DepartmentID
        JOIN Positions p ON e.PositionID = p.PositionID""")
        columns = [col[0] for col in cursor.description]
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return data
    finally:
        conn.close()

def get_payroll_data():
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.EmployeeID as id,
                e.FullName   as name,
                d.DepartmentName as dept,
                p.PositionName   as role,
                e.Status as status
            FROM employees_payroll e
            LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN positions_payroll   p ON e.PositionID   = p.PositionID
        """)
        return cursor.fetchall()  # trả trực tiếp list[dict]
    finally:
        conn.close()

def get_salary_data():
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT EmployeeID as id, BaseSalary as salary FROM salaries")
        return cursor.fetchall()
    finally:
        conn.close()  
        
              
def get_departments():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments")
        rows = cursor.fetchall()
        return [{"id": row[0], "name": row[1]} for row in rows]
    finally:
        conn.close()

def get_roles():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT PositionID, PositionName FROM Positions")
        rows = cursor.fetchall()
        return [{"id": row[0], "name": row[1]} for row in rows]
    finally:
        conn.close()