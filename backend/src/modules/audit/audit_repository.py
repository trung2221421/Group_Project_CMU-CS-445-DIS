import json
from typing import Any, Optional

from src.config.auth_db import get_auth_connection
from src.config.AccessControlDB import get_connection


AUDIT_STATUS_MAP = {
    "SUCCESS": "SUCCESS",
    "FAILED": "FAILED",
    "ERROR": "FAILED",
    "WARNING": "WARNING",
    "PARTIAL": "WARNING",
    "PARTIAL_FAILED": "WARNING",
    "RUNNING": "WARNING",
}


def _to_json(value: Any) -> Optional[str]:
    if value is None or value == "":
        return None

    if isinstance(value, str):
        # dashboard_integration uses JSON columns.
        # Plain strings must be encoded as valid JSON strings.
        return json.dumps(value, ensure_ascii=False, default=str)

    return json.dumps(value, ensure_ascii=False, default=str)


def _normalize_status(status: Any) -> str:
    return AUDIT_STATUS_MAP.get(str(status or "SUCCESS").upper(), "WARNING")


def _normalize_action(action: Any) -> str:
    return str(action or "UNKNOWN_ACTION").strip().upper().replace(" ", "_")[:100]


def _normalize_module(module: Any) -> str:
    return str(module or "SYSTEM").strip()[:100]


def _user_value(user_context: Optional[dict], *keys, default=None):
    """
    Lấy giá trị user từ nhiều kiểu key khác nhau.

    Hỗ trợ cả:
    {
        "userId": 1,
        "userName": "admin",
        "fullName": "Admin"
    }

    hoặc:
    {
        "user": {
            "userId": 1,
            "userName": "admin",
            "fullName": "Admin"
        }
    }
    """
    if not user_context:
        return default

    for key in keys:
        if key in user_context and user_context[key] not in (None, ""):
            return user_context[key]

    nested = user_context.get("user") if isinstance(user_context.get("user"), dict) else None

    if nested:
        for key in keys:
            if key in nested and nested[key] not in (None, ""):
                return nested[key]

    return default


def ensure_audit_user(user_id=None, username=None, email=None, full_name=None):
    """
    Đảm bảo user từ AccessControlDB có bản ghi mirror trong database audit.

    audit_logs.UserID thường có foreign key tới bảng users của database audit.
    Vì user đăng nhập nằm bên AccessControlDB nên cần mirror tối thiểu sang bảng users.
    """
    if not user_id:
        return None

    username = username or f"user_{user_id}"
    email = email or f"user_{user_id}@local.audit"
    full_name = full_name or username

    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (UserID, Username, Email, PasswordHash, FullName, Status)
            VALUES (%s, %s, %s, %s, %s, 'ACTIVE')
            ON DUPLICATE KEY UPDATE
                Username = VALUES(Username),
                Email = VALUES(Email),
                FullName = VALUES(FullName),
                Status = 'ACTIVE',
                UpdatedAt = CURRENT_TIMESTAMP
            """,
            (
                int(user_id),
                username,
                email,
                "external-auth",
                full_name,
            ),
        )
        conn.commit()
        return int(user_id)
    except Exception:
        conn.rollback()
        return None
    finally:
        conn.close()


def create_audit_log(
    action,
    module,
    detail,
    user_id=None,
    username="system",
    role_name="system",
    target_type=None,
    target_id=None,
    sync_batch_id=None,
    sync_log_id=None,
    old_value=None,
    new_value=None,
    ip_address=None,
    user_agent=None,
    status="SUCCESS",
):
    valid_user_id = ensure_audit_user(
        user_id=user_id,
        username=username,
        email=None,
        full_name=username,
    )

    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_logs
            (UserID, SyncBatchID, SyncLogID, Action, Module, TargetType, TargetID,
             Detail, OldValue, NewValue, IPAddress, UserAgent, Status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CAST(%s AS JSON), CAST(%s AS JSON), %s, %s, %s)
            """,
            (
                valid_user_id,
                sync_batch_id,
                sync_log_id,
                _normalize_action(action),
                _normalize_module(module),
                str(target_type)[:100] if target_type else None,
                str(target_id) if target_id is not None else None,
                str(detail or "")[:65535],
                _to_json(old_value),
                _to_json(new_value),
                ip_address,
                user_agent,
                _normalize_status(status),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def create_audit_log_from_user(
    action,
    module,
    detail,
    user_context=None,
    target_type=None,
    target_id=None,
    sync_batch_id=None,
    sync_log_id=None,
    old_value=None,
    new_value=None,
    ip_address=None,
    user_agent=None,
    status="SUCCESS",
):
    user_id = _user_value(
        user_context,
        "id",
        "UserID",
        "user_id",
        "userId",
    )

    username = _user_value(
        user_context,
        "username",
        "UserName",
        "Username",
        "userName",
        default="system",
    )

    email = _user_value(
        user_context,
        "email",
        "Email",
    )

    full_name = _user_value(
        user_context,
        "fullName",
        "FullName",
        "full_name",
        "name",
        default=username,
    )

    valid_user_id = ensure_audit_user(user_id, username, email, full_name)

    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_logs
            (UserID, SyncBatchID, SyncLogID, Action, Module, TargetType, TargetID,
             Detail, OldValue, NewValue, IPAddress, UserAgent, Status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CAST(%s AS JSON), CAST(%s AS JSON), %s, %s, %s)
            """,
            (
                valid_user_id,
                sync_batch_id,
                sync_log_id,
                _normalize_action(action),
                _normalize_module(module),
                str(target_type)[:100] if target_type else None,
                str(target_id) if target_id is not None else None,
                str(detail or "")[:65535],
                _to_json(old_value),
                _to_json(new_value),
                ip_address,
                user_agent,
                _normalize_status(status),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def _fetch_roles_by_user_ids(user_ids):

    clean_user_ids = []

    for user_id in user_ids:
        if user_id not in (None, ""):
            try:
                clean_user_ids.append(int(user_id))
            except Exception:
                pass

    clean_user_ids = sorted(set(clean_user_ids))

    if not clean_user_ids:
        return {}

    placeholders = ",".join(["?"] * len(clean_user_ids))

    sql = f"""
        SELECT
            ur.UserID,
            r.RoleName
        FROM dbo.User_Role ur
        INNER JOIN dbo.Roles r ON r.RoleID = ur.RoleID
        WHERE ur.UserID IN ({placeholders})
        ORDER BY r.RoleName
    """

    conn = get_connection("AccessControlDB")
    try:
        cursor = conn.cursor()
        cursor.execute(sql, clean_user_ids)
        rows = cursor.fetchall()

        role_map = {}

        for row in rows:
            user_id = row[0]
            role_name = row[1]

            if user_id is None or not role_name:
                continue

            user_id = int(user_id)
            role_map.setdefault(user_id, [])

            if role_name not in role_map[user_id]:
                role_map[user_id].append(role_name)

        return {
            user_id: ", ".join(role_names)
            for user_id, role_names in role_map.items()
        }
    finally:
        conn.close()


def _attach_roles_to_logs(logs):
    if not logs:
        return []

    user_ids = []

    for log in logs:
        if isinstance(log, dict):
            user_ids.append(log.get("user_id") or log.get("UserID"))
        else:
            # Tuple index 1 là user_id theo SELECT bên dưới
            user_ids.append(log[1])

    role_map = _fetch_roles_by_user_ids(user_ids)

    result = []

    for log in logs:
        if isinstance(log, dict):
            user_id = log.get("user_id") or log.get("UserID")

            try:
                log["role"] = role_map.get(int(user_id), "system") if user_id else "system"
            except Exception:
                log["role"] = "system"

            result.append(log)
        else:
            item = {
                "id": log[0],
                "user_id": log[1],
                "user": log[2],
                "username": log[3],
                "full_name": log[4],
                "email": log[5],
                "sync_batch_id": log[6],
                "sync_log_id": log[7],
                "action": log[8],
                "module": log[9],
                "target_type": log[10],
                "target_id": log[11],
                "detail": log[12],
                "old_value": log[13],
                "new_value": log[14],
                "ip_address": log[15],
                "user_agent": log[16],
                "status": log[17],
                "time": log[18],
            }

            user_id = item.get("user_id")

            try:
                item["role"] = role_map.get(int(user_id), "system") if user_id else "system"
            except Exception:
                item["role"] = "system"

            result.append(item)

    return result


def get_audit_logs(action=None, module=None, username=None, limit=100):
    """
    Lấy audit logs từ database audit, sau đó gắn role từ AccessControlDB.

    Không JOIN trực tiếp AccessControlDB ở đây vì:
    - audit DB đang dùng get_auth_connection()
    - AccessControlDB đang dùng SQL Server qua pyodbc
    """
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()

        sql = """
            SELECT
                al.AuditLogID AS id,
                al.UserID AS user_id,
                COALESCE(u.FullName, u.Username, u.Email, 'system') AS user,
                u.Username AS username,
                u.FullName AS full_name,
                u.Email AS email,
                al.SyncBatchID AS sync_batch_id,
                al.SyncLogID AS sync_log_id,
                al.Action AS action,
                al.Module AS module,
                al.TargetType AS target_type,
                al.TargetID AS target_id,
                al.Detail AS detail,
                JSON_UNQUOTE(JSON_EXTRACT(al.OldValue, '$')) AS old_value,
                JSON_UNQUOTE(JSON_EXTRACT(al.NewValue, '$')) AS new_value,
                al.IPAddress AS ip_address,
                al.UserAgent AS user_agent,
                al.Status AS status,
                DATE_FORMAT(al.CreatedAt, '%%Y-%%m-%%d %%H:%%i:%%s') AS time
            FROM audit_logs al
            LEFT JOIN users u ON u.UserID = al.UserID
            WHERE 1 = 1
        """

        params = []

        if action:
            sql += " AND al.Action = %s"
            params.append(_normalize_action(action))

        if module:
            sql += " AND al.Module = %s"
            params.append(_normalize_module(module))

        if username:
            sql += """
                AND (
                    u.Username LIKE %s
                    OR u.FullName LIKE %s
                    OR u.Email LIKE %s
                    OR al.Detail LIKE %s
                )
            """
            keyword = f"%{username}%"
            params.extend([keyword, keyword, keyword, keyword])

        sql += " ORDER BY al.CreatedAt DESC LIMIT %s"
        params.append(max(1, min(int(limit or 100), 1000)))

        cursor.execute(sql, params)
        logs = cursor.fetchall()
    finally:
        conn.close()

    return _attach_roles_to_logs(logs)