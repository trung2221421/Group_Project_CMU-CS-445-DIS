# src/middlewares/auth_middleware.py
"""
Middleware giả lập session. Khi có auth thật, chỉ cần sửa get_current_user.
"""

import logging
from fastapi import Header, HTTPException, Depends
from typing import Optional
from src.config.permissions import USERS

logger = logging.getLogger("auth_middleware")

def get_current_user(x_user: Optional[str] = Header(None)):
    """
    Dependency để lấy thông tin user hiện tại từ header X-User.
    Sẽ được thay thế bằng JWT token sau khi có module auth.
    """
    if x_user and x_user in USERS:
        user = USERS[x_user]
        logger.info(f"👤 User đăng nhập: {user['username']} | Role: {user['role']} | Dept: {user.get('department')}")
        return user
    logger.info(f"👤 User không xác định (guest), X-User={x_user}")
    # Mặc định là user không có quyền gì
    return {"username": "guest", "role": "nhan_vien", "department": None}