# src/config/permissions.py
"""
Cấu hình phân quyền và logic kiểm tra quyền.
Khi có module auth thật, chỉ cần sửa USERS và các hàm kiểm tra.
"""

import logging

# Cấu hình logging để in ra console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("permissions")

# Mock users – thay đổi X-User header để test quyền khác nhau
USERS = {
    "admin": {
        "username": "admin",
        "role": "giam_doc",
        "department": "Ban Giám đốc",
    },
    "ketoan_truong": {
        "username": "ketoan_truong",
        "role": "truong_phong",
        "department": "Phòng Kế toán",
    },
    "ketoan_vien": {
        "username": "ketoan_vien",
        "role": "nhan_vien",
        "department": "Phòng Kế toán",
    },
    "truong_phong_kythuat": {
        "username": "truong_phong_kythuat",
        "role": "truong_phong",
        "department": "Phòng Kỹ thuật",
    },
    "nhanvien": {
        "username": "nhanvien",
        "role": "nhan_vien",
        "department": "Phòng Nhân sự",
    },
}

# Phân cấp vai trò (số càng cao quyền càng lớn)
ROLE_LEVEL = {
    "nhan_vien": 0,
    "truong_phong": 1,
    "giam_doc": 2,
}

def has_min_role(user: dict, min_role: str) -> bool:
    """Kiểm tra user có vai trò tối thiểu nào đó không"""
    user_role = user.get("role", "nhan_vien")
    user_level = ROLE_LEVEL.get(user_role, -1)
    required_level = ROLE_LEVEL.get(min_role, 99)
    result = user_level >= required_level
    logger.info(f"🔐 Kiểm tra quyền: user={user.get('username')} role={user_role} yêu cầu={min_role} => {'✅' if result else '❌'}")
    return result

def is_accountant(user: dict) -> bool:
    """Kiểm tra user có thuộc phòng kế toán không"""
    result = user.get("department") == "Phòng Kế toán"
    logger.info(f"🔐 Kiểm tra kế toán: user={user.get('username')} department={user.get('department')} => {'✅' if result else '❌'}")
    return result