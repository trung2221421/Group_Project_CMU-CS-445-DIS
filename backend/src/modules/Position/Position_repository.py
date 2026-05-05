from src.config.HUMAN_sqlserver import get_sqlserver_connection


def _rows(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_all_positions():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT p.PositionID, p.PositionName, p.CreatedAt, p.UpdatedAt,
                   COUNT(e.EmployeeID) AS EmployeeCount
            FROM Positions p
            LEFT JOIN Employees e ON e.PositionID = p.PositionID
            GROUP BY p.PositionID, p.PositionName, p.CreatedAt, p.UpdatedAt
            ORDER BY p.PositionID
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_position_by_id(pos_id: int):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT PositionID, PositionName, CreatedAt, UpdatedAt FROM Positions WHERE PositionID = ?", pos_id)
        rows = _rows(cursor)
        return rows[0] if rows else None
    finally:
        conn.close()


def get_position_by_name(name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT PositionID, PositionName FROM Positions WHERE PositionName = ?", name)
        rows = _rows(cursor)
        return rows[0] if rows else None
    finally:
        conn.close()


def create_position(name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO Positions (PositionName) VALUES (?)", name)
        cursor.execute("SELECT CONVERT(INT, SCOPE_IDENTITY()) AS id")
        pos_id = cursor.fetchone()[0]
        conn.commit()
        return get_position_by_id(pos_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_position(pos_id: int, name: str):
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Positions SET PositionName = ?, UpdatedAt = GETDATE() WHERE PositionID = ?", name, pos_id)
        if cursor.rowcount == 0:
            conn.rollback()
            return None
        conn.commit()
        return get_position_by_id(pos_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def count_employees_by_position(pos_id: int) -> int:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Employees WHERE PositionID = ?", pos_id)
        return int(cursor.fetchone()[0])
    finally:
        conn.close()


def delete_position(pos_id: int) -> bool:
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Positions WHERE PositionID = ?", pos_id)
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
