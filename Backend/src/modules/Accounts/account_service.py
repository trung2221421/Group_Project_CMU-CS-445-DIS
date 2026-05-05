# src/modules/Accounts/account_service.py
from .account_repository import (
    get_user_by_username,
    get_user_by_employee_id,
    create_user,
    update_user_password,
    deactivate_user_by_employee,
    delete_user_by_employee,
)

def register_account(username: str, password: str, employee_id: int, full_name: str, email: str = None):
    if get_user_by_username(username):
        raise ValueError("Tên đăng nhập đã tồn tại")
    if get_user_by_employee_id(employee_id):
        raise ValueError("Nhân viên này đã có tài khoản")
    # TODO: Hash password thực tế
    password_hash = password
    user_id = create_user(username, full_name, email, password_hash, employee_id)
    return {"user_id": user_id, "message": "Tạo tài khoản thành công"}

def change_password(user_id: int, new_password: str):
    password_hash = new_password
    update_user_password(user_id, password_hash)
    return {"message": "Đổi mật khẩu thành công"}

def disable_account_by_employee(emp_id: int):
    deactivate_user_by_employee(emp_id)
    return {"message": "Đã vô hiệu hóa tài khoản"}

def remove_account_by_employee(emp_id: int):
    delete_user_by_employee(emp_id)
    return {"message": "Đã xóa tài khoản"}