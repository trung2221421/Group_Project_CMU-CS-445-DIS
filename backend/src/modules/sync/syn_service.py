from .sync_repository import (
    SOURCE_SYSTEM_CODE,
    TARGET_SYSTEM_CODE,
    create_sync_batch,
    finish_sync_batch,
    get_hr_employees,
    get_hr_departments,
    get_hr_positions,
    upsert_payroll_employee,
    upsert_payroll_department,
    upsert_payroll_position,
    upsert_entity_mapping,
    mark_entity_mapping_failed,
    insert_sync_log,
    get_sync_logs,
    get_sync_batches,
)
from src.modules.audit.audit_service import log_action


ENTITY_CONFIG = {
    "departments": {
        "entity_type": "DEPARTMENT",
        "sync_type": "DEPARTMENT_ONLY",
        "human_table": "Departments",
        "payroll_table": "departments_payroll",
        "id_field": "DepartmentID",
        "name_field": "DepartmentName",
        "fetch": get_hr_departments,
        "upsert": upsert_payroll_department,
        "action": "SYNC_DEPARTMENTS",
        "label": "Department",
    },
    "positions": {
        "entity_type": "POSITION",
        "sync_type": "POSITION_ONLY",
        "human_table": "Positions",
        "payroll_table": "positions_payroll",
        "id_field": "PositionID",
        "name_field": "PositionName",
        "fetch": get_hr_positions,
        "upsert": upsert_payroll_position,
        "action": "SYNC_POSITIONS",
        "label": "Position",
    },
    "employees": {
        "entity_type": "EMPLOYEE",
        "sync_type": "EMPLOYEE_ONLY",
        "human_table": "Employees",
        "payroll_table": "employees_payroll",
        "id_field": "EmployeeID",
        "name_field": "FullName",
        "fetch": get_hr_employees,
        "upsert": upsert_payroll_employee,
        "action": "SYNC_EMPLOYEES",
        "label": "Employee",
    },
}


def _actor_info(actor=None):
    actor = actor or {}
    user = actor.get("user") or {}
    roles = actor.get("roles") or []
    role_name = "system"
    if roles:
        first = roles[0]
        role_name = first.get("RoleName") or first.get("roleName") or first.get("name") or "system"
    return {
        "user_id": user.get("id") or user.get("UserID"),
        "username": user.get("username") or user.get("UserName") or user.get("email") or "system",
        "role_name": role_name,
    }


def _sync_entity(entity_key, actor=None, sync_batch_id=None, write_audit=True):
    config = ENTITY_CONFIG[entity_key]
    info = _actor_info(actor)
    owns_batch = sync_batch_id is None
    batch_id = sync_batch_id or create_sync_batch(config["sync_type"], started_by_user_id=info["user_id"])

    success = 0
    failed = 0
    records = config["fetch"]()

    for record in records:
        entity_id = record[config["id_field"]]
        name = record.get(config["name_field"], entity_id)
        try:
            payroll_record_id = config["upsert"](record)
            mapping_id = upsert_entity_mapping(
                entity_type=config["entity_type"],
                human_table_name=config["human_table"],
                human_record_id=entity_id,
                payroll_table_name=config["payroll_table"],
                payroll_record_id=payroll_record_id or entity_id,
                sync_status="SYNCED",
                last_error=None,
            )
            insert_sync_log(
                sync_batch_id=batch_id,
                mapping_id=mapping_id,
                entity_type=config["entity_type"],
                entity_id=entity_id,
                action="UPSERT",
                status="SUCCESS",
                old_value=None,
                new_value=record,
                message=f"Synced {config['label'].lower()} {name} from {SOURCE_SYSTEM_CODE} to {TARGET_SYSTEM_CODE}",
            )
            success += 1
        except Exception as exc:
            mapping_id = mark_entity_mapping_failed(
                entity_type=config["entity_type"],
                human_table_name=config["human_table"],
                human_record_id=entity_id,
                last_error=str(exc),
            )
            insert_sync_log(
                sync_batch_id=batch_id,
                mapping_id=mapping_id,
                entity_type=config["entity_type"],
                entity_id=entity_id,
                action="UPSERT",
                status="FAILED",
                old_value=None,
                new_value=record,
                message=str(exc),
            )
            failed += 1

    total = success + failed
    final_status = "SUCCESS" if failed == 0 else ("FAILED" if success == 0 else "PARTIAL_FAILED")

    if owns_batch:
        finish_sync_batch(batch_id, total, success, failed, final_status)

    if write_audit:
        log_action(
            action=config["action"],
            module="Integration Sync",
            target_type=config["entity_type"],
            target_id=batch_id,
            sync_batch_id=batch_id,
            detail=f"{config['label']} sync completed. Success: {success}, Failed: {failed}",
            status="SUCCESS" if failed == 0 else "WARNING",
            **info,
        )

    return {
        "entity": entity_key,
        "sync_batch_id": batch_id,
        "success": success,
        "failed": failed,
        "total": total,
        "status": final_status,
    }


def sync_departments(actor=None, sync_batch_id=None, write_audit=True):
    return _sync_entity("departments", actor=actor, sync_batch_id=sync_batch_id, write_audit=write_audit)


def sync_positions(actor=None, sync_batch_id=None, write_audit=True):
    return _sync_entity("positions", actor=actor, sync_batch_id=sync_batch_id, write_audit=write_audit)


def sync_employees(actor=None, sync_batch_id=None, write_audit=True):
    return _sync_entity("employees", actor=actor, sync_batch_id=sync_batch_id, write_audit=write_audit)


def sync_all(actor=None):
    info = _actor_info(actor)
    batch_id = create_sync_batch("FULL", started_by_user_id=info["user_id"])

    details = {
        "departments": sync_departments(actor=actor, sync_batch_id=batch_id, write_audit=False),
        "positions": sync_positions(actor=actor, sync_batch_id=batch_id, write_audit=False),
        "employees": sync_employees(actor=actor, sync_batch_id=batch_id, write_audit=False),
    }

    total_success = sum(item["success"] for item in details.values())
    total_failed = sum(item["failed"] for item in details.values())
    total_records = total_success + total_failed
    final_status = "SUCCESS" if total_failed == 0 else ("FAILED" if total_success == 0 else "PARTIAL_FAILED")

    finish_sync_batch(batch_id, total_records, total_success, total_failed, final_status)

    log_action(
        action="SYNC_HR_PAYROLL",
        module="Integration Sync",
        target_type="SYNC_BATCH",
        target_id=batch_id,
        sync_batch_id=batch_id,
        detail=f"HR to Payroll sync completed. Success: {total_success}, Failed: {total_failed}",
        status="SUCCESS" if total_failed == 0 else "WARNING",
        **info,
    )

    return {
        "message": "Sync completed",
        "sync_batch_id": batch_id,
        "status": final_status,
        "success": total_success,
        "failed": total_failed,
        "total": total_records,
        "details": details,
    }


def list_sync_logs(limit=100):
    return get_sync_logs(limit)


def list_sync_batches(limit=100):
    return get_sync_batches(limit)
