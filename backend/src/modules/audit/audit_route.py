from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, Header, Query, Request
from pydantic import BaseModel

from .audit_service import list_audit_logs, log_user_action

try:
    from src.modules.auth.auth_route import decode_token, get_user_profile, require_permission
except Exception:
    decode_token = None
    get_user_profile = None

    def require_permission(function_name: str, permission_name: str = "View"):
        def dependency():
            return None
        return dependency


router = APIRouter()


class AuditTrackRequest(BaseModel):
    action: str
    module: str
    detail: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    status: str = "SUCCESS"


def _extract_profile_user(profile):
    if not profile:
        return None
    if isinstance(profile, dict) and isinstance(profile.get("user"), dict):
        return profile["user"]
    if isinstance(profile, dict):
        return profile
    return None


def get_optional_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    if not decode_token or not get_user_profile:
        return None
    try:
        payload = decode_token(authorization.split(" ", 1)[1])
        profile = get_user_profile(int(payload["sub"]))
        return _extract_profile_user(profile)
    except Exception:
        return None


@router.get("/")
async def get_logs(
    action: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    limit: int = Query(100),
    current_user=Depends(require_permission("Audit Logs", "View")),
):
    return list_audit_logs(action, module, username, limit)


@router.post("/track")
async def track_user_action(
    payload: AuditTrackRequest = Body(...),
    request: Request = None,
    current_user=Depends(get_optional_current_user),
):
    log_id = log_user_action(
        action=payload.action,
        module=payload.module,
        detail=payload.detail,
        user_context=current_user,
        target_type=payload.target_type,
        target_id=payload.target_id,
        old_value=payload.old_value,
        new_value=payload.new_value,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
        status=payload.status,
    )
    return {"message": "Audit log saved", "id": log_id}
