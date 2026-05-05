from starlette.middleware.base import BaseHTTPMiddleware

from src.modules.audit.audit_service import log_user_action

try:
    from src.modules.auth.auth_route import decode_token, get_user_profile
    
except Exception:
    decode_token = None
    get_user_profile = None


SKIP_PREFIXES = (
    "/docs",
    "/openapi.json",
    "/health",
    "/favicon.ico",
    "/api/audit-logs",
)

MODULE_BY_PREFIX = {
    "/api/auth": "AUTH",
    "/api/employees": "EMPLOYEES",
    "/api/departments": "DEPARTMENTS",
    "/api/positions": "POSITIONS",
    "/api/payroll": "PAYROLL",
    "/api/attendance": "ATTENDANCE",
    "/api/reports": "REPORTS",
    "/api/sync": "SYNC",
    "/api/notifications": "NOTIFICATIONS",
    "/api/v1/dashboard": "DASHBOARD",
}

IMPORTANT_GET_PREFIXES = (
    "/api/employees",
    "/api/departments",
    "/api/positions",
    "/api/payroll",
    "/api/attendance",
    "/api/reports",
    "/api/sync",
    "/api/notifications",
    "/api/v1/dashboard",
)


def _method_action(method: str, path: str) -> str:
    method = method.upper()

    if "/export" in path:
        return "EXPORT"

    if "/sync" in path or path.endswith("/all"):
        return "SYNC"

    return {
        "GET": "VIEW",
        "POST": "CREATE",
        "PUT": "UPDATE",
        "PATCH": "UPDATE",
        "DELETE": "DELETE",
    }.get(method, "ACTION")


def _module_for_path(path: str) -> str:
    for prefix, module in MODULE_BY_PREFIX.items():
        if path.startswith(prefix):
            return module
    return "SYSTEM"


def _module_label(module: str) -> str:
    return {
        "AUTH": "xác thực / đăng nhập",
        "EMPLOYEES": "nhân viên",
        "DEPARTMENTS": "phòng ban",
        "POSITIONS": "chức vụ",
        "PAYROLL": "bảng lương",
        "ATTENDANCE": "chấm công",
        "REPORTS": "báo cáo",
        "SYNC": "đồng bộ dữ liệu",
        "NOTIFICATIONS": "thông báo",
        "DASHBOARD": "dashboard",
        "SYSTEM": "hệ thống",
    }.get(str(module or "SYSTEM").upper(), str(module or "hệ thống"))


def _action_label(action: str) -> str:
    return {
        "VIEW": "Xem",
        "CREATE": "Tạo mới",
        "UPDATE": "Cập nhật",
        "DELETE": "Xóa",
        "EXPORT": "Xuất dữ liệu",
        "SYNC": "Đồng bộ",
        "ACTION": "Thực hiện thao tác",
    }.get(str(action or "ACTION").upper(), "Thực hiện thao tác")


def _friendly_detail(action: str, module: str, status_code: int) -> str:
    result = "thành công" if status_code < 400 else "thất bại"
    return f"{_action_label(action)} {_module_label(module)} {result}"


def _get_user_from_auth_header(auth_header: str | None):
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    if not decode_token or not get_user_profile:
        return None

    try:
        payload = decode_token(auth_header.split(" ", 1)[1])
        profile = get_user_profile(int(payload["sub"]))

        if isinstance(profile, dict) and isinstance(profile.get("user"), dict):
            user = profile["user"]

            # Nếu get_user_profile có trả roles ở ngoài user thì gộp vào user
            if "roles" in profile and "roles" not in user:
                user["roles"] = profile["roles"]

            return user

        return profile
    except Exception:
        return None


class AuditLoggerMiddleware(BaseHTTPMiddleware):
    """Log user web/API actions to dashboard_integration.audit_logs.

    Add in main.py after app is created:
        from src.modules.audit.audit_middleware import AuditLoggerMiddleware
        app.add_middleware(AuditLoggerMiddleware)
    """

    async def dispatch(self, request, call_next):
        response = await call_next(request)

        path = request.url.path

        if any(path.startswith(prefix) for prefix in SKIP_PREFIXES):
            return response

        method = request.method.upper()

        # Ghi log các thao tác thay đổi dữ liệu.
        # Với GET chỉ ghi ở các module chính để tránh log rác.
        should_log = (
            method in {"POST", "PUT", "PATCH", "DELETE"}
            or any(path.startswith(prefix) for prefix in IMPORTANT_GET_PREFIXES)
        )

        if not should_log:
            return response

        try:
            user = _get_user_from_auth_header(request.headers.get("authorization"))
            status = "SUCCESS" if response.status_code < 400 else "FAILED"
            action = _method_action(method, path)
            module = _module_for_path(path)
            detail = _friendly_detail(action, module, response.status_code)

            log_user_action(
                action=action,
                module=module,
                detail=detail,
                user_context=user,
                target_type="API_ENDPOINT",
                target_id=path,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status=status,
            )
        except Exception:
            # Audit logging must not break the business API response.
            pass

        return response