from flask import Flask, jsonify, request
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

SERVER_NAME = r"DESKTOP-DHT\SQLEXPRESS"


def get_connection(database_name):
    return pyodbc.connect(
        "DRIVER={SQL Server};"
        f"SERVER={SERVER_NAME};"
        f"DATABASE={database_name};"
        "Trusted_Connection=yes;"
    )


try:
    conn_accesscontrol = get_connection("AccessControlDB")
    print("Kết nối với AccessControlDB thành công!")
except Exception as e:
    print(f"Lỗi kết nối AccessControlDB: {e}")
    exit(1)


try:
    conn_human = get_connection("HUMAN_2025")
    print("Kết nối với HUMAN_2025 thành công!")
except Exception as e:
    print(f"Lỗi kết nối HUMAN_2025: {e}")
    exit(1)


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Missing request body"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    try:
        cursor = conn_accesscontrol.cursor()

        query_user = """
            SELECT UserName, UserID, EmployeeID
            FROM dbo.Users
            WHERE Email = ? AND PasswordHash = ?
        """

        cursor.execute(query_user, (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "Invalid credentials"}), 401

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

        query_permissions = """
            SELECT FunctionName, PermissionName
            FROM dbo.vw_UserPermissionDetails
            WHERE UserName = ?
        """

        cursor.execute(query_permissions, (user.UserName,))
        permissions = [
            {
                "function": row.FunctionName,
                "permission": row.PermissionName
            }
            for row in cursor.fetchall()
        ]

        token = "fake_token_123456"

        return jsonify({
            "token": token,
            "user": {
                "userName": user.UserName,
                "userId": user.UserID,
                "employeeId": user.EmployeeID,
                "fullName": employee.FullName
            },
            "permissions": permissions
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Server error",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)