Ở phần module sẽ chưa các func của 1 trang ví dụ nếu làm ở trang employees thì Func sẽ là của trang đó. tất cả func của trang đó sẽ ở đó

src/
 ├── config/                  Nơi chứa tất cả config dùng chung
 |   ├── env.py
 |   ├──mysql.py
 |   ├──sqlserver.py
 ├── middlewares/             xử lý trung gian
 ├── utils/                   Những function nhỏ, dùng lại nhiều nơi
 ├── modules/
 │   ├── Func/
 │   │   ├── Func_controller.py   Nhận request và trả response     
 │   │   ├── Func_service.py      Xử lý logic chính
 │   │   ├── Func_repository.py   Làm việc với database
 │   │   ├── Func_model.py        Định nghĩa structure dữ liệu (entity)
 │   │   ├── Func_schema.py       Validate request/response (Pydantic)
 │   │   └── Func_route.py        Nhận request từ frontend
 │   ├── payroll/
 │   ├── attendance/
 │   └── auth/
 └── main.py






 tải tất cả thư viện: 
            pip install -r requirements.txt


phần đã sửa
src/
 ├── config/                  Nơi chứa tất cả config dùng chung
 |   ├── env.py
 |   ├──mysql.py
 |   ├──sqlserver.py
 ├── middlewares/             xử lý trung gian
 ├── utils/                   Những function nhỏ, dùng lại nhiều nơi
 ├── modules/
 │   ├── Func/
 │   │   ├── Func_controller.py   Nhận request và trả response     
 │   │   ├── Func_service.py      Xử lý logic chính
 │   │   ├── Func_repository.py   Làm việc với database
 │   │   ├── Func_model.py        Định nghĩa structure dữ liệu (entity)
 │   │   ├── Func_schema.py       Validate request/response (Pydantic)
 │   │   └── Func_route.py        Nhận request từ frontend
 |   ├── employee/
 │   │   ├── employee_controller.py       
 │   │   ├── employee_service.py      
 │   │   ├── employee_repository.py   
 │   │   └── employee_route.py       
 |   ├── employees/
 │   │   ├── employee_controller.py       
 │   │   ├── employee_service.py      
 │   │   ├── employee_repository.py   
 │   │   ├── employee_model.py        
 │   │   ├── employee_schema.py       
 │   │   └── employee_route.py     
 └── main.py
