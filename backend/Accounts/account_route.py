# src/modules/Accounts/account_route.py
from fastapi import APIRouter, HTTPException, Depends
from .account_schema import CreateAccountRequest
from .account_controller import create_account, deactivate_account, delete_account
from src.middlewares.auth_middleware import get_current_user

router = APIRouter()

@router.post("/create")
async def create(request: CreateAccountRequest, user: dict = Depends(get_current_user)):
    try:
        result = create_account(
            username=request.username,
            password=request.password,
            employee_id=request.employee_id,
            full_name=request.full_name,
            email=request.email
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{emp_id}/deactivate")
async def deactivate(emp_id: int, user: dict = Depends(get_current_user)):
    return deactivate_account(emp_id)

@router.delete("/{emp_id}")
async def delete(emp_id: int, user: dict = Depends(get_current_user)):
    return delete_account(emp_id)
@router.get("/check-username")
async def check_username(username: str):
    from .account_repository import get_user_by_username
    user = get_user_by_username(username)
    return {"exists": user is not None}