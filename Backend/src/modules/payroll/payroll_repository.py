from typing import Optional

class PayrollRepository:
    def __init__(self, conn):
        self.conn = conn

    # FR15
    def get_latest_salary(self, employee_id: int):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT BaseSalary, Bonus, Deductions, NetSalary, SalaryMonth
                FROM salaries
                WHERE EmployeeID = %s
                ORDER BY SalaryMonth DESC
                LIMIT 1
            """, (employee_id,))
            return cursor.fetchone()

    # FR16 – lịch sử lương (không trùng tháng), thêm SalaryID
    def get_salary_history(self, employee_id: int):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT s.SalaryID, BaseSalary, Bonus, Deductions, NetSalary,
                       DATE_FORMAT(SalaryMonth, '%%Y-%%m') as SalaryMonth
                FROM salaries s
                WHERE EmployeeID = %s
                  AND s.SalaryID IN (
                      SELECT MAX(SalaryID)
                      FROM salaries
                      WHERE EmployeeID = %s
                      GROUP BY DATE(SalaryMonth)
                  )
                ORDER BY SalaryMonth DESC
            """, (employee_id, employee_id))
            return cursor.fetchall()

    # FR18
    def get_attendance_by_month(self, employee_id: int, month: str):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT WorkDays, LeaveDays, AbsentDays, AttendanceMonth
                FROM attendance
                WHERE EmployeeID = %s
                AND DATE_FORMAT(AttendanceMonth, '%%Y-%%m') = %s
                ORDER BY CreatedAt DESC
                LIMIT 1
            """, (employee_id, month))
            return cursor.fetchone()

    # Danh sách lương theo tháng (không trùng), thêm SalaryID
    def get_salaries_by_month(self, month: str, department_name: Optional[str] = None):
        query = """
            SELECT
                s.SalaryID,
                s.EmployeeID,
                e.FullName,
                d.DepartmentName,
                s.BaseSalary,
                s.Bonus,
                s.Deductions,
                s.NetSalary,
                DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') as SalaryMonth
            FROM salaries s
            JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
            LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
            WHERE DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') = %s
              AND s.SalaryID = (
                  SELECT MAX(s2.SalaryID)
                  FROM salaries s2
                  WHERE s2.EmployeeID = s.EmployeeID
                    AND DATE_FORMAT(s2.SalaryMonth, '%%Y-%%m') = %s
              )
        """
        params = [month, month]
        if department_name:
            query += " AND d.DepartmentName = %s"
            params.append(department_name)
        query += " ORDER BY s.EmployeeID"

        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    # Lịch sử lương cho export (thêm SalaryID)
    def get_employee_salary_history_for_export(self, employee_id: int, year: Optional[int] = None):
        query = """
            SELECT s.SalaryID, BaseSalary, Bonus, Deductions, NetSalary,
                   DATE_FORMAT(SalaryMonth, '%%Y-%%m') as SalaryMonth
            FROM salaries s
            WHERE EmployeeID = %s
              AND s.SalaryID IN (
                  SELECT MAX(SalaryID)
                  FROM salaries
                  WHERE EmployeeID = %s
                  GROUP BY DATE(SalaryMonth)
              )
        """
        params = [employee_id, employee_id]
        if year:
            query += " AND YEAR(SalaryMonth) = %s"
            params.append(year)
        query += " ORDER BY SalaryMonth ASC"

        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    # Toàn bộ điểm danh (không trùng tháng)
    def get_attendance_history(self, employee_id: int):
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
                ORDER BY AttendanceMonth ASC
            """, (employee_id, employee_id))
            return cursor.fetchall()

    # Thông tin nhân viên
    def get_employee_info(self, employee_id: int):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT e.FullName, d.DepartmentName
                FROM employees_payroll e
                LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
                WHERE e.EmployeeID = %s
            """, (employee_id,))
            return cursor.fetchone()

    # === CÁC HÀM MỚI ===

    # Lấy danh sách phòng ban
    def get_all_departments(self):
        with self.conn.cursor() as cursor:
            cursor.execute("SELECT DepartmentID, DepartmentName FROM departments_payroll ORDER BY DepartmentName")
            return cursor.fetchall()

    # Cập nhật lương và phòng ban (tìm bản ghi mới nhất trong tháng)
    def update_salary_and_department(self, employee_id: int, month: str, base: float, bonus: float, deductions: float, dept_name: str = None):
        with self.conn.cursor() as cursor:
            if dept_name:
                cursor.execute("""
                    UPDATE employees_payroll
                    SET DepartmentID = (SELECT DepartmentID FROM departments_payroll WHERE DepartmentName = %s)
                    WHERE EmployeeID = %s
                """, (dept_name, employee_id))
            net = base + bonus - deductions
            cursor.execute("""
                UPDATE salaries
                SET BaseSalary = %s, Bonus = %s, Deductions = %s, NetSalary = %s
                WHERE SalaryID = (
                    SELECT MAX(SalaryID)
                    FROM salaries
                    WHERE EmployeeID = %s AND DATE_FORMAT(SalaryMonth, '%%Y-%%m') = %s
                )
            """, (base, bonus, deductions, net, employee_id, month))
            self.conn.commit()

    # Xoá toàn bộ dữ liệu lương, điểm danh, thông tin nhân viên trong DB payroll
    def delete_employee_payroll_data(self, employee_id: int):
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM salaries WHERE EmployeeID = %s", (employee_id,))
            cursor.execute("DELETE FROM attendance WHERE EmployeeID = %s", (employee_id,))
            cursor.execute("DELETE FROM employees_payroll WHERE EmployeeID = %s", (employee_id,))
            self.conn.commit()

    # API lấy dữ liệu thô cho xu hướng lương
    def get_salary_trend(self, months: int, reference_month: str, department_name: Optional[str] = None):
        query = """
            SELECT DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') AS Month,
                   s.NetSalary
            FROM salaries s
            JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
            LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
            WHERE s.SalaryID IN (
                SELECT MAX(SalaryID)
                FROM salaries
                WHERE EmployeeID = s.EmployeeID
                GROUP BY DATE(SalaryMonth)
            )
            AND DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') <= %s
        """
        params = [reference_month]
        if department_name:
            query += " AND d.DepartmentName = %s"
            params.append(department_name)
        query += " ORDER BY Month DESC"

        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    # === HÀM XUẤT EXCEL MỚI ===
    def get_all_salaries_for_export(self, month: str):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT s.EmployeeID, e.FullName, d.DepartmentName,
                       s.BaseSalary, s.Bonus, s.Deductions, s.NetSalary,
                       DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') as SalaryMonth
                FROM salaries s
                JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
                LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
                WHERE DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') = %s
                  AND s.SalaryID = (
                      SELECT MAX(SalaryID)
                      FROM salaries
                      WHERE EmployeeID = s.EmployeeID
                        AND DATE_FORMAT(SalaryMonth, '%%Y-%%m') = %s
                  )
                ORDER BY d.DepartmentName, e.EmployeeID
            """, (month, month))
            return cursor.fetchall()

    def get_salaries_by_department_for_export(self, month: str, department_name: str):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT s.EmployeeID, e.FullName, d.DepartmentName,
                       s.BaseSalary, s.Bonus, s.Deductions, s.NetSalary,
                       DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') as SalaryMonth
                FROM salaries s
                JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
                LEFT JOIN departments_payroll d ON e.DepartmentID = d.DepartmentID
                WHERE DATE_FORMAT(s.SalaryMonth, '%%Y-%%m') = %s
                  AND d.DepartmentName = %s
                  AND s.SalaryID = (
                      SELECT MAX(SalaryID)
                      FROM salaries
                      WHERE EmployeeID = s.EmployeeID
                        AND DATE_FORMAT(SalaryMonth, '%%Y-%%m') = %s
                  )
                ORDER BY e.EmployeeID
            """, (month, department_name, month))
            return cursor.fetchall()