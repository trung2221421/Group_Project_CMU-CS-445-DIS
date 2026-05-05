from fastapi import APIRouter, HTTPException, Path, Body
from .employee_schema import EmployeeCreate, EmployeeUpdate
from .employee_controller import add_employee, edit_employee

router = APIRouter()

@router.post("/", status_code=201)
async def create_employee(employee: EmployeeCreate):
    try:
        result = add_employee(employee.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{emp_id}")
async def update_employee(emp_id: int = Path(...), employee: EmployeeUpdate = Body(...)):
    try:
        update_data = {k: v for k, v in employee.dict().items() if v is not None}
        result = edit_employee(emp_id, update_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))