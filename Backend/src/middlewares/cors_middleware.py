# src/middlewares/cors_middleware.py
"""
CORS Middleware - Cấu hình chung cho toàn bộ application
Quản lý Cross-Origin Resource Sharing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI) -> None:
    """
    Thiết lập CORS cho toàn bộ ứng dụng
    
    Args:
        app: FastAPI application instance
    """
    
    # Danh sách origins được phép truy cập
    allowed_origins = [
        "http://localhost:5173",      # Vite dev server
        "http://localhost:3000",      # React CRA
        "http://localhost:8000",      # Backend self (cho testing)
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Thêm production origins nếu có
    # allowed_origins.extend([
    #     "https://yourdomain.com",
    #     "https://www.yourdomain.com",
    # ])
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-User",
        ],
        expose_headers=[
            "Content-Length",
            "Content-Range",
        ],
        max_age=3600,  # Cache preflight request trong 1 giờ
    )
    
    print("     CORS middleware đã được cấu hình cho toàn bộ ứng dụng")
    print(f"    Allowed origins: {', '.join(allowed_origins)}")
