from flask import Flask, jsonify, request
from flask_cors import CORS
import pyodbc  # Đảm bảo sử dụng pyodbc cho cả SQL Server

app = Flask(__name__)
CORS(app)

# Kết nối tới cơ sở dữ liệu SQL Server (AccessControlDB)
try:
    conn_accesscontrol = pyodbc.connect(
        "DRIVER={SQL Server};"
        "SERVER=DESKTOP-R4TO9PD;"  # Tên máy chủ của bạn
        "DATABASE=AccessControlDB;"  # Cơ sở dữ liệu AccessControlDB
        "Trusted_Connection=yes;"  # Đăng nhập sử dụng tài khoản Windows
    )
    print("Kết nối với AccessControlDB thành công!")
except Exception as e:
    print(f"Lỗi kết nối SQL Server: {e}")
    exit(1)

# Kết nối tới cơ sở dữ liệu SQL Server (HUMAN_2025)
try:
    conn_human = pyodbc.connect(
        "DRIVER={SQL Server};"
        "SERVER=DESKTOP-R4TO9PD;"  # Tên máy chủ của bạn
        "DATABASE=HUMAN_2025;"  # Cơ sở dữ liệu HUMAN_2025
        "Trusted_Connection=yes;"  # Đăng nhập sử dụng tài khoản Windows
    )
    print("Kết nối với HUMAN_2025 thành công!")
except Exception as e:
    print(f"Lỗi kết nối SQL Server: {e}")
    exit(1)

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Kiểm tra email và mật khẩu từ cơ sở dữ liệu AccessControlDB
    cursor = conn_accesscontrol.cursor()
    query = """
    SELECT UserName, UserID, EmployeeID
    FROM dbo.Users
    WHERE Email = ? AND PasswordHash = ?
    """
    cursor.execute(query, email, password)
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    # Kiểm tra nhân viên trong cơ sở dữ liệu HUMAN_2025
    cursor_human = conn_human.cursor()
    query_employee = """
    SELECT EmployeeID, FullName
    FROM dbo.Employees
    WHERE EmployeeID = ?
    """
    cursor_human.execute(query_employee, (user.EmployeeID,))
    employee = cursor_human.fetchone()

    if not employee:
        return jsonify({"message": "Employee not found in HUMAN_2025"}), 404

    # Lấy quyền của user từ bảng vw_UserPermissions trong AccessControlDB
    query_permissions = """
    SELECT FunctionName, PermissionName
    FROM dbo.vw_UserPermissionDetails
    WHERE UserName = ?
    """
    cursor.execute(query_permissions, user.UserName)
    permissions = [{"function": row[0], "permission": row[1]} for row in cursor.fetchall()]

    # Tạo token giả (nếu cần dùng JWT thì sẽ khác)
    token = "fake_token_123456"  # Sử dụng JWT thật ở đây nếu cần

    return jsonify({
        "token": token,
        "user": {"userName": user.UserName, "userId": user.UserID, "fullName": employee.FullName},
        "permissions": permissions
    })

if __name__ == '__main__':
    app.run(debug=True)