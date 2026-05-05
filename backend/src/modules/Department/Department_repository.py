from src.config.HUMAN_sqlserver import get_sqlserver_connection


def _rows(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_all_departments():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT d.DepartmentID, d.DepartmentName, d.CreatedAt, d.UpdatedAt,
                   COUNT(e.EmployeeID) AS EmployeeCount
            FROM Departments d
            LEFT JOIN Employees e ON e.DepartmentID = d.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName, d.CreatedAt, d.UpdatedAt
            ORDER BY d.DepartmentID
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_department_by_id(dept_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DepartmentID, DepartmentName, CreatedAt, UpdatedAt
            FROM Departments
            WHERE DepartmentID = ?
            """,
            dept_id,
        )
        rows = _rows(cursor)
        return rows[0] if rows else None
    finally:
        conn.close()


def get_department_by_name(name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments WHERE DepartmentName = ?", name)
        rows = _rows(cursor)
        return rows[0] if rows else None
    finally:
        conn.close()


def create_department(name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO Departments (DepartmentName) VALUES (?)", name)
        cursor.execute("SELECT CONVERT(INT, SCOPE_IDENTITY()) AS id")
        dept_id = cursor.fetchone()[0]
        conn.commit()
        return get_department_by_id(dept_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_department(dept_id: int, name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Departments SET DepartmentName = ?, UpdatedAt = GETDATE() WHERE DepartmentID = ?", name, dept_id)
        if cursor.rowcount == 0:
            conn.rollback()
            return None
        conn.commit()
        return get_department_by_id(dept_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def count_employees_by_department(dept_id: int) -> int:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Employees WHERE DepartmentID = ?", dept_id)
        return int(cursor.fetchone()[0])
    finally:
        conn.close()


def delete_department(dept_id: int) -> bool:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Departments WHERE DepartmentID = ?", dept_id)
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
