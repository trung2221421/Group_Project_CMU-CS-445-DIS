## Cấu trúc chính

```txt
backend/
│── src/
│   ├── config/        # cấu hình (db, env, security...)
│   ├── controllers/   # nhận request từ client
│   ├── services/      # xử lý logic chính
│   ├── repositories/  # làm việc với database
│   ├── models/        # định nghĩa data (User, Employee...)
│   ├── routes/        # định nghĩa API (python)
│   ├── middlewares/   # auth, validate, error handler
│   ├── utils/         # helper function
│   └── app.py / main.py
│
├── .env               # biến môi trường
<!-- ├── package.json       # (Node.js) -->
├── pom.xml            # (Java - nếu dùng Spring Boot)
└── README.md


Những file có tên sẵn thì sửa 1 vài cái ở bên trong để đúng với cấu trúc của máy
còn những file test.py thì chứa các chức năng chính của từng loại chức năng


KHO THƯ VIỆN
- chạy lệnh trên cmd: pip install -r requirements.txt