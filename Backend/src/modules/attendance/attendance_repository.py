from typing import Optional

class AttendanceRepository:
    def __init__(self, conn):
        self.conn = conn

    # Lấy điểm danh của một nhân viên trong tháng (giữ nguyên)
    def get_attendance_by_month(self, employee_id: int, month: str):
        with self.conn.cursor() as cursor:
            query = """
                SELECT WorkDays, LeaveDays, AbsentDays, AttendanceMonth
                FROM attendance
                WHERE EmployeeID = %s
                AND DATE_FORMAT(AttendanceMonth, '%%Y-%%m') = %s
                ORDER BY CreatedAt DESC
                LIMIT 1
            """
            cursor.execute(query, (employee_id, month))
            return cursor.fetchone()

    # Danh sách điểm danh của tất cả nhân viên trong tháng (chống trùng)
    def get_attendance_list_by_month(self, month: str, department_name: Optional[str] = None, search: Optional[str] = None):
        query = """
            SELECT
                e.EmployeeID,
                e.FullName,
                d.DepartmentName,
                a.WorkDays,
                a.LeaveDays,
                a.AbsentDays,
                DATE_FORMAT(a.AttendanceMonth, '%%Y-%%m') as AttendanceMonth
            FROM attendance a
            JOIN employees_payroll e ON a.EmployeeID = e.EmployeeID
            LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
            WHERE DATE_FORMAT(a.AttendanceMonth, '%%Y-%%m') = %s
              AND a.AttendanceID = (
                  SELECT MAX(a2.AttendanceID)
                  FROM attendance a2
                  WHERE a2.EmployeeID = a.EmployeeID
                    AND DATE_FORMAT(a2.AttendanceMonth, '%%Y-%%m') = %s
              )
        """
        params = [month, month]

        if department_name:
            query += " AND d.DepartmentName = %s"
            params.append(department_name)

        if search:
            query += " AND (e.FullName LIKE %s OR e.EmployeeID LIKE %s)"
            like_search = f"%{search}%"
            params.extend([like_search, like_search])

        query += " ORDER BY e.EmployeeID"

        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    # Thống kê tổng trong tháng
    def get_attendance_stats(self, month: str):
        query = """
            SELECT
                SUM(WorkDays) as TotalWorkDays,
                SUM(LeaveDays) as TotalLeaveDays,
                SUM(AbsentDays) as TotalAbsentDays
            FROM (
                SELECT WorkDays, LeaveDays, AbsentDays
                FROM attendance
                WHERE DATE_FORMAT(AttendanceMonth, '%%Y-%%m') = %s
                  AND AttendanceID IN (
                      SELECT MAX(AttendanceID)
                      FROM attendance
                      WHERE DATE_FORMAT(AttendanceMonth, '%%Y-%%m') = %s
                      GROUP BY EmployeeID
                  )
            ) as unique_att
        """
        with self.conn.cursor() as cursor:
            cursor.execute(query, (month, month))
            return cursor.fetchone()

    # Toàn bộ dữ liệu điểm danh cho xuất Excel (không trùng, có thể lọc tháng)
    def get_attendance_for_export(self, month: Optional[str] = None):
        query = """
            SELECT
                e.EmployeeID,
                e.FullName,
                d.DepartmentName,
                a.WorkDays,
                a.LeaveDays,
                a.AbsentDays,
                DATE_FORMAT(a.AttendanceMonth, '%%Y-%%m') as AttendanceMonth
            FROM attendance a
            JOIN employees_payroll e ON a.EmployeeID = e.EmployeeID
            LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
            WHERE a.AttendanceID IN (
                SELECT MAX(AttendanceID)
                FROM attendance
                GROUP BY EmployeeID, DATE(AttendanceMonth)
            )
        """
        params = []
        if month:
            query += " AND DATE_FORMAT(a.AttendanceMonth, '%%Y-%%m') = %s"
            params.append(month)
        query += " ORDER BY a.AttendanceMonth, e.EmployeeID"

        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    # Lấy lịch sử điểm danh `months` tháng gần nhất của nhân viên (không trùng tháng)
    def get_attendance_history(self, employee_id: int, months: int = 6):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT WorkDays, LeaveDays, AbsentDays,
                       DATE_FORMAT(AttendanceMonth, '%%Y-%%m') as AttendanceMonth
                FROM attendance
                WHERE EmployeeID = %s
                  AND AttendanceID IN (
                      SELECT MAX(AttendanceID)
                      FROM attendance
                      WHERE EmployeeID = %s
                      GROUP BY DATE(AttendanceMonth)
                  )
                ORDER BY AttendanceMonth DESC
                LIMIT %s
            """, (employee_id, employee_id, months))
            return cursor.fetchall()