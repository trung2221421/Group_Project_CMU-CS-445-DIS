from src.config.auth_db import get_auth_connection


VALID_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
VALID_STATUSES = {"OPEN", "CLOSED"}


def _normalize_level(level):
    value = str(level or "LOW").upper()
    return value if value in VALID_LEVELS else "LOW"


def _normalize_status(status):
    value = str(status or "OPEN").upper()
    return value if value in VALID_STATUSES else "OPEN"


def _bool_to_int(value):
    if value is None:
        return None
    return 1 if bool(value) else 0


def create_notification(
    type_,
    title,
    message=None,
    employee_id=None,
    level="LOW",
    status="OPEN",
    content=None,
):
    """
    Create one notification in the Dashboard authentication database.

    The CEO memo requires alerts to be implemented in the Dashboard layer and not by
    changing the HR or Payroll schemas. Therefore notifications are stored in the
    dedicated auth/dashboard database.
    """
    final_content = content if content is not None else message
    if not type_:
        raise ValueError("Notification type is required")
    if not title:
        raise ValueError("Notification title is required")

    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO notifications
                    (Type, Level, Title, Content, EmployeeID, IsRead, Status, CreatedAt)
                VALUES
                    (%s, %s, %s, %s, %s, 0, %s, NOW())
                """,
                (
                    str(type_).upper(),
                    _normalize_level(level),
                    title,
                    final_content,
                    employee_id,
                    _normalize_status(status),
                ),
            )
        conn.commit()
        return True
    finally:
        conn.close()


def notification_exists(type_, employee_id=None, title=None, status="OPEN"):
    """
    Return True when an open notification with the same business key exists.
    This prevents duplicate alerts when users click Generate multiple times.
    """
    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT NotificationID
                FROM notifications
                WHERE Type = %s
                  AND Status = %s
            """
            params = [str(type_).upper(), _normalize_status(status)]

            if employee_id is None:
                sql += " AND EmployeeID IS NULL"
            else:
                sql += " AND EmployeeID = %s"
                params.append(employee_id)

            if title:
                sql += " AND Title = %s"
                params.append(title)

            sql += " LIMIT 1"
            cursor.execute(sql, tuple(params))
            return cursor.fetchone() is not None
    finally:
        conn.close()


def list_notifications(type_=None, is_read=None, limit=100, status=None, level=None):
    """List notifications using safe filters for the Alerts dashboard."""
    safe_limit = max(1, min(int(limit or 100), 500))

    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    NotificationID AS id,
                    Type AS type,
                    Level AS level,
                    Title AS title,
                    Content AS content,
                    Content AS message,
                    EmployeeID AS employee_id,
                    IsRead AS is_read,
                    Status AS status,
                    CreatedAt AS time
                FROM notifications
                WHERE 1 = 1
            """
            params = []

            if type_:
                sql += " AND Type = %s"
                params.append(str(type_).upper())

            if is_read is not None:
                sql += " AND IsRead = %s"
                params.append(_bool_to_int(is_read))

            if status:
                sql += " AND Status = %s"
                params.append(_normalize_status(status))

            if level:
                sql += " AND Level = %s"
                params.append(_normalize_level(level))

            sql += " ORDER BY CreatedAt DESC LIMIT %s"
            params.append(safe_limit)

            cursor.execute(sql, tuple(params))
            return cursor.fetchall()
    finally:
        conn.close()


def mark_notification_read(notification_id):
    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE notifications
                SET IsRead = 1
                WHERE NotificationID = %s
                """,
                (notification_id,),
            )
            affected = cursor.rowcount
        conn.commit()
        return affected
    finally:
        conn.close()


def mark_all_notifications_read():
    conn = get_auth_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE notifications SET IsRead = 1 WHERE IsRead = 0")
            affected = cursor.rowcount
        conn.commit()
        return affected
    finally:
        conn.close()


# Backward-compatible alias for older imports.
def mark_all_as_read():
    return mark_all_notifications_read()
