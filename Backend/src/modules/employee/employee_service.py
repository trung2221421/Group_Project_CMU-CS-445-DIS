from .employee_repository import (
    insert_employee,
    update_employee,
    insert_payroll_employee,
    get_department_by_id,
    get_position_by_id
)

def create_employee(data: dict):
    # Chuyển đổi kiểu dữ liệu nếu cần
    if 'department_id' in data and data['department_id'] is not None:
        data['department_id'] = int(data['department_id'])
    if 'position_id' in data and data['position_id'] is not None:
        data['position_id'] = int(data['position_id'])
    if data.get('department_id'):
        dept = get_department_by_id(data['department_id'])
        if not dept:
            raise ValueError("Phòng ban không tồn tại")
    if data.get('position_id'):
        pos = get_position_by_id(data['position_id'])
        if not pos:
            raise ValueError("Chức vụ không tồn tại")
    new_id = insert_employee(data)
    if data.get('sync_to_payroll', True):
        try:
            insert_payroll_employee(new_id, data)
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
    return {"message": "Cập nhật thành công"}