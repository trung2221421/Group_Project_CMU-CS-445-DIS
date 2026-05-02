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