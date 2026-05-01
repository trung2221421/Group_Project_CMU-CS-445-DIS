## Cấu trúc chính

```txt
backend/
│── src/
│   ├── config/        # cấu hình (db, env, security...)
│   ├── controllers/   # nhận request từ client
│   ├── services/      # xử lý logic chính
│   ├── repositories/  # làm việc với database
│   ├── models/        # định nghĩa data (User, Employee...)
│   ├── routes/        # định nghĩa API (Node.js)
│   ├── middlewares/   # auth, validate, error handler
│   ├── utils/         # helper function
│   └── app.js / main.js
│
├── .env               # biến môi trường
├── package.json       # (Node.js)
├── pom.xml            # (Java - nếu dùng Spring Boot)
└── README.md