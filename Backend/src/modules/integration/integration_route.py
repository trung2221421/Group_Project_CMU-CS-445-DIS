from fastapi import APIRouter, Depends, HTTPException, Request
from .integration_controller import (
    get_status, get_logs, get_sync_stats,get_employee_comparison, get_department_comparison, get_position_comparison,sync_single_employee,
    sync_employees, sync_departments, sync_positions, sync_all
)

router = APIRouter(prefix="/api/integration", tags=["integration"])

router.add_api_route("/status", get_status, methods=["GET"])
router.add_api_route("/logs", get_logs, methods=["GET"])
router.add_api_route("/sync/employees", sync_employees, methods=["POST"])
router.add_api_route("/sync/departments", sync_departments, methods=["POST"])
router.add_api_route("/sync/positions", sync_positions, methods=["POST"])
router.add_api_route("/sync/all", sync_all, methods=["POST"])
router.add_api_route("/compare/employees", get_employee_comparison, methods=["GET"])
router.add_api_route("/compare/departments", get_department_comparison, methods=["GET"])
router.add_api_route("/compare/positions", get_position_comparison, methods=["GET"])
router.add_api_route("/stats", get_sync_stats, methods=["GET"])
router.add_api_route("/sync/employee/{emp_id}", sync_single_employee, methods=["POST"])