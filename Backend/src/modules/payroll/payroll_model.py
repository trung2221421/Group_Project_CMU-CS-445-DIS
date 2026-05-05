class Salary:
    def __init__(self, BaseSalary, Bonus, Deductions, NetSalary, SalaryMonth):
        self.BaseSalary = BaseSalary
        self.Bonus = Bonus
        self.Deductions = Deductions
        self.NetSalary = NetSalary
        self.SalaryMonth = SalaryMonth


class Attendance:
    def __init__(self, WorkDays, LeaveDays, AbsentDays, AttendanceMonth):
        self.WorkDays = WorkDays
        self.LeaveDays = LeaveDays
        self.AbsentDays = AbsentDays
        self.AttendanceMonth = AttendanceMonth