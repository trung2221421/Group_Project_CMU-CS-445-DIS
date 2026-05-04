from .employee_repository import (
    insert_employee,
    update_employee,
    insert_payroll_employee,
    update_payroll_employee,    # import hàm mới
    get_department_by_id,
    get_position_by_id
)

def create_employee(data: dict):
    if 'department_id' in data and data['department_id'] is not None:
        data['department_id'] = int(data['department_id'])
    if 'position_id' in data and data['position_id'] is not None:
        data['position_id'] = int(data['position_id'])
    # Kiểm tra tồn tại phòng ban/chức vụ
    if data.get('department_id'):
        dept = get_department_by_id(data['department_id'])
        if not dept:
            raise ValueError("Phòng ban không tồn tại")
    if data.get('position_id'):
        pos = get_position_by_id(data['position_id'])
        if not pos:
            raise ValueError("Chức vụ không tồn tại")
    new_id = insert_employee(data)
    # Đồng bộ payroll nếu cần
    if data.get('sync_to_payroll', True):
        try:
            insert_payroll_employee(new_id, data, data.get('status', 'Đang làm việc'))
        except Exception as e:
            print(f"Lỗi đồng bộ payroll: {e}")
    return {"id": new_id, "message": "Thêm mới thành công"}

def update_employee_data(emp_id: int, data: dict):
    if data.get('department_id'):
        if not get_department_by_id(data['department_id']):
            raise ValueError("Phòng ban không tồn tại")
    if data.get('position_id'):
        if not get_position_by_id(data['position_id']):
            raise ValueError("Chức vụ không tồn tại")
    update_employee(emp_id, data)
    # Cập nhật status trong payroll nếu có
    if 'status' in data and data['status'] is not None:
        try:
            update_payroll_employee(emp_id, data['status'])
        except Exception as e:
            print(f"Lỗi cập nhật status payroll: {e}")
    return {"message": "Cập nhật thành công"}