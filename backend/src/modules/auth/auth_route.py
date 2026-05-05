import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

import pyodbc
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL_SECONDS", "86400"))
TOKEN_SECRET = os.getenv("AUTH_TOKEN_SECRET", "change-this-secret-in-production")


class LoginRequest(BaseModel):
    email: str
    password: str


def _auth_connection_string() -> str:
    explicit = os.getenv("AUTH_SQLSERVER_CONNECTION_STRING")
    if explicit:
        return explicit

    driver = os.getenv("AUTH_SQLSERVER_DRIVER", os.getenv("SQLSERVER_DRIVER", "ODBC Driver 18 for SQL Server"))
    server = os.getenv("AUTH_SQLSERVER_HOST", os.getenv("SQLSERVER_HOST", r"DESKTOP-DHT\SQLEXPRESS"))
    database = os.getenv("AUTH_SQLSERVER_DATABASE", os.getenv("AUTH_DB_NAME", "AccessControlDB"))
    user = os.getenv("AUTH_SQLSERVER_USER", os.getenv("SQLSERVER_USER", "sa"))
    password = os.getenv("AUTH_SQLSERVER_PASSWORD", os.getenv("SQLSERVER_PASSWORD", "12345"))
    trusted = os.getenv("AUTH_SQLSERVER_TRUSTED_CONNECTION", os.getenv("SQLSERVER_TRUSTED_CONNECTION", "false")).lower() in {"1", "true", "yes"}

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
        "Encrypt=yes",
        "TrustServerCertificate=yes",
    ]
    if trusted:
        parts.append("Trusted_Connection=yes")
    else:
        parts.extend([f"UID={user}", f"PWD={password}"])
    return ";".join(parts) + ";"


def get_auth_sqlserver_connection():
    return pyodbc.connect(_auth_connection_string())


def rows_to_dicts(cursor) -> list[dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def verify_password(plain_password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False

    # Database mẫu đang lưu PasswordHash = "123". Vẫn hỗ trợ hash SHA-256/PBKDF2 cơ bản
    # để có thể nâng cấp dần mà không làm hỏng dữ liệu demo hiện tại.
    if stored_hash == plain_password:
        return True

    sha256_value = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    if hmac.compare_digest(stored_hash.lower(), sha256_value.lower()):
        return True

    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt, expected = stored_hash.split("$", 3)
            actual = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations),
            ).hex()
            return hmac.compare_digest(actual, expected)
        except Exception:
            return False

    return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(user_id: int) -> str:
    payload = {"sub": user_id, "iat": int(time.time()), "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    payload_part = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(TOKEN_SECRET.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_part}.{_b64url_encode(signature)}"


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload_part, signature_part = token.split(".", 1)
        expected = hmac.new(TOKEN_SECRET.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
        actual = _b64url_decode(signature_part)
        if not hmac.compare_digest(expected, actual):
            raise ValueError("bad signature")
        payload = json.loads(_b64url_decode(payload_part))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc đã hết hạn")


def get_user_profile(user_id: int) -> dict[str, Any] | None:
    conn = get_auth_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT UserID, UserName, FullName, Email, IsActive, EmployeeID, CreatedAt
            FROM dbo.Users
            WHERE UserID = ? AND IsActive = 1
            """,
            user_id,
        )
        user_rows = rows_to_dicts(cursor)
        if not user_rows:
            return None
        user = user_rows[0]

        cursor.execute(
            """
            SELECT r.RoleID, r.RoleName, r.Description
            FROM dbo.User_Role ur
            JOIN dbo.Roles r ON r.RoleID = ur.RoleID
            WHERE ur.UserID = ?
            ORDER BY r.RoleID
            """,
            user_id,
        )
        roles = rows_to_dicts(cursor)

        cursor.execute(
            """
            SELECT DISTINCT
                m.ModuleID,
                m.ModuleName,
                f.FunctionID,
                f.FunctionName,
                p.PermissionID,
                p.PermissionName
            FROM dbo.User_Role ur
            JOIN dbo.Role_Permission rp ON rp.RoleID = ur.RoleID
            JOIN dbo.Permissions p ON p.PermissionID = rp.PermissionID
            JOIN dbo.Functions f ON f.FunctionID = rp.FunctionID
            LEFT JOIN dbo.Modules m ON m.ModuleID = COALESCE(rp.ModuleID, f.ModuleID)
            WHERE ur.UserID = ?
            ORDER BY m.ModuleID, f.FunctionID, p.PermissionID
            """,
            user_id,
        )
        permission_rows = rows_to_dicts(cursor)

        permission_map: dict[str, dict[str, Any]] = {}
        permissions: list[dict[str, Any]] = []
        for row in permission_rows:
            key = row["FunctionName"]
            if key not in permission_map:
                item = {
                    "moduleId": row["ModuleID"],
                    "moduleName": row["ModuleName"],
                    "functionId": row["FunctionID"],
                    "functionName": row["FunctionName"],
                    "actions": [],
                }
                permission_map[key] = item
                permissions.append(item)
            action = row["PermissionName"]
            if action not in permission_map[key]["actions"]:
                permission_map[key]["actions"].append(action)

        return {
            "user": {
                "id": user["UserID"],
                "username": user["UserName"],
                "fullName": user["FullName"],
                "email": user["Email"],
                "employeeId": user["EmployeeID"],
            },
            "roles": roles,
            "permissions": permissions,
        }
    finally:
        conn.close()


def log_auth_action(user_id: int | None, username: str | None, action: str, detail: str, status_value: str, request: Request):
    try:
        conn = get_auth_sqlserver_connection()
        cursor = conn.cursor()
        # AccessControlDB.bacpac không có audit_logs; nếu DB thật có bảng này thì ghi log, không có thì bỏ qua.
        cursor.execute(
            """
            IF OBJECT_ID('dbo.audit_logs', 'U') IS NOT NULL
            INSERT INTO dbo.audit_logs (UserID, Username, Action, Module, Detail, IPAddress, Status, CreatedAt)
            VALUES (?, ?, ?, 'Authentication', ?, ?, ?, GETDATE())
            """,
            user_id,
            username or "unknown",
            action,
            detail,
            request.client.host if request.client else None,
            status_value,
        )
        conn.commit()
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except Exception:
            pass


@router.post("/login")
def login(payload: LoginRequest, request: Request):
    conn = get_auth_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT UserID, UserName, FullName, Email, PasswordHash, IsActive, EmployeeID
            FROM dbo.Users
            WHERE LOWER(Email) = LOWER(?)
            """,
            payload.email,
        )
        rows = rows_to_dicts(cursor)
    finally:
        conn.close()

    if not rows:
        log_auth_action(None, payload.email, "LOGIN", "Email không tồn tại", "FAILED", request)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    user = rows[0]
    if not user.get("IsActive"):
        log_auth_action(user["UserID"], user["UserName"], "LOGIN", "Tài khoản bị khóa", "FAILED", request)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    if not verify_password(payload.password, user.get("PasswordHash")):
        log_auth_action(user["UserID"], user["UserName"], "LOGIN", "Sai mật khẩu", "FAILED", request)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    profile = get_user_profile(user["UserID"])
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Không thể tải thông tin người dùng")

    token = create_token(user["UserID"])
    log_auth_action(user["UserID"], user["UserName"], "LOGIN", "Đăng nhập thành công", "SUCCESS", request)
    return {"accessToken": token, **profile}


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu token đăng nhập")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu token đăng nhập")

    payload = decode_token(token)
    profile = get_user_profile(int(payload["sub"]))
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Không tìm thấy người dùng")
    return profile


def require_permission(function_name: str, permission_name: str = "View"):
    def dependency(current_user: dict[str, Any] = Depends(get_current_user)):
        from src.config.auth import has_permission

        if not has_permission(current_user, function_name, permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền {permission_name} cho chức năng {function_name}",
            )
        return current_user

    return dependency


@router.get("/me")
def me(current_user: dict[str, Any] = Depends(get_current_user)):
    return current_user
