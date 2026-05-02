# src/middlewares/employee_cors.py
"""
CORS Middleware riêng cho Employee Module
Có thể thêm các rules đặc biệt cho employee endpoints
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List


class EmployeeCORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS Middleware cho Employee endpoints
    Cho phép kiểm soát chi tiết hơn các request đến /api/employees
    """
    
    def __init__(
        self,
        app,
        allowed_origins: List[str] = None,
        allowed_methods: List[str] = None
    ):
        super().__init__(app)
        self.allowed_origins = allowed_origins or [
            "http://localhost:5173",
            "http://localhost:3000",
        ]
        self.allowed_methods = allowed_methods or [
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Chỉ áp dụng cho employee endpoints
        if request.url.path.startswith("/api/employees"):
            origin = request.headers.get("origin")
            
            # Log request (có thể bỏ trong production)
            print(f"📥 Employee API Request: {request.method} {request.url.path}")
            print(f"   Origin: {origin}")
            
            # Kiểm tra origin
            if origin and origin not in self.allowed_origins:
                print(f"   ⚠️  Origin {origin} không được phép!")
                # Có thể return 403 Forbidden ở đây
                # Nhưng để CORS middleware chính xử lý
        
        response = await call_next(request)
        
        # Thêm custom headers cho employee responses
        if request.url.path.startswith("/api/employees"):
            response.headers["X-Employee-API-Version"] = "1.0"
            response.headers["X-Content-Type-Options"] = "nosniff"
        
        return response


def setup_employee_cors(app: FastAPI) -> None:
    """
    Thiết lập CORS riêng cho Employee module
    
    Args:
        app: FastAPI application instance
    """
    
    # Cấu hình origins đặc biệt cho employee
    employee_allowed_origins = [
        "http://localhost:5173",      # Frontend dev
        "http://localhost:3000",
        "http://localhost:8000",      # Backend self
    ]
    
    # Cấu hình methods đặc biệt cho employee
    employee_allowed_methods = [
        "GET",      # Lấy danh sách, filters
        "POST",     # Thêm nhân viên mới
        "PUT",      # Cập nhật nhân viên
        "DELETE",   # Xóa nhân viên
        "OPTIONS",  # Preflight requests
    ]
    
    # Thêm custom middleware cho employee
    app.add_middleware(
        EmployeeCORSMiddleware,
        allowed_origins=employee_allowed_origins,
        allowed_methods=employee_allowed_methods,
    )
    
    print("✅ Employee CORS middleware đã được cấu hình")
    print(f"   Employee allowed origins: {', '.join(employee_allowed_origins)}")
    print(f"   Employee allowed methods: {', '.join(employee_allowed_methods)}")