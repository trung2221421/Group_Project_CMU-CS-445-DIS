import json
from src.config.HUMAN_sqlserver import get_sqlserver_connection
from src.config.payroll_mysql import get_mysql_connection
from src.config.auth_db import get_auth_connection

SOURCE_SYSTEM_CODE = "HUMAN"
TARGET_SYSTEM_CODE = "PAYROLL"

SYNC_TYPE_MAP = {
    "all": "FULL",
    "employees": "EMPLOYEE_ONLY",
    "departments": "DEPARTMENT_ONLY",
    "positions": "POSITION_ONLY",
    "EMPLOYEE": "EMPLOYEE_ONLY",
    "DEPARTMENT": "DEPARTMENT_ONLY",
    "POSITION": "POSITION_ONLY",
}

SYNC_BATCH_STATUS_MAP = {
    "RUNNING": "RUNNING",
    "SUCCESS": "SUCCESS",
    "FAILED": "FAILED",
    "PARTIAL": "PARTIAL_FAILED",
    "PARTIAL_FAILED": "PARTIAL_FAILED",
}

SYNC_LOG_STATUS_MAP = {
    "SUCCESS": "SUCCESS",
    "FAILED": "FAILED",
    "CONFLICT": "CONFLICT",
    "WARNING": "CONFLICT",
    "PARTIAL": "CONFLICT",
}


def _to_json(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, default=str)


def _batch_status(status):
    return SYNC_BATCH_STATUS_MAP.get(str(status or "RUNNING").upper(), "FAILED")


def _log_status(status):
    return SYNC_LOG_STATUS_MAP.get(str(status or "SUCCESS").upper(), "FAILED")


def create_sync_batch(sync_type="FULL", started_by_user_id=None):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO sync_batches
            (StartedByUserID, SyncType, Direction, Status, TotalRecords, SuccessRecords, FailedRecords)
            VALUES (%s, %s, 'HR_TO_PAYROLL', 'RUNNING', 0, 0, 0)
            """,
            (started_by_user_id, SYNC_TYPE_MAP.get(sync_type, sync_type)),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def finish_sync_batch(sync_batch_id, total_records, success_records, failed_records, status=None):
    final_status = status or ("SUCCESS" if failed_records == 0 else "PARTIAL_FAILED")
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE sync_batches
            SET Status = %s,
                TotalRecords = %s,
                SuccessRecords = %s,
                FailedRecords = %s,
                FinishedAt = NOW()
            WHERE SyncBatchID = %s
            """,
            (_batch_status(final_status), int(total_records), int(success_records), int(failed_records), sync_batch_id),
        )
        conn.commit()
    finally:
        conn.close()


def upsert_entity_mapping(
    entity_type,
    human_table_name,
    human_record_id,
    payroll_table_name,
    payroll_record_id,
    sync_status="SYNCED",
    last_error=None,
):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO entity_mappings
            (EntityType, HumanTableName, HumanRecordID, PayrollTableName, PayrollRecordID,
             SyncStatus, LastSyncedAt, LastError)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
            ON DUPLICATE KEY UPDATE
                PayrollTableName = VALUES(PayrollTableName),
                PayrollRecordID = VALUES(PayrollRecordID),
                SyncStatus = VALUES(SyncStatus),
                LastSyncedAt = NOW(),
                LastError = VALUES(LastError)
            """,
            (
                entity_type,
                human_table_name,
                int(human_record_id),
                payroll_table_name,
                int(payroll_record_id),
                sync_status,
                last_error,
            ),
        )
        conn.commit()
        cursor.execute(
            """
            SELECT MappingID
            FROM entity_mappings
            WHERE EntityType = %s AND HumanTableName = %s AND HumanRecordID = %s
            """,
            (entity_type, human_table_name, int(human_record_id)),
        )
        row = cursor.fetchone()
        return row["MappingID"] if row else None
    finally:
        conn.close()


def mark_entity_mapping_failed(entity_type, human_table_name, human_record_id, last_error):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO entity_mappings
            (EntityType, HumanTableName, HumanRecordID, PayrollTableName, PayrollRecordID,
             SyncStatus, LastSyncedAt, LastError)
            VALUES (%s, %s, %s, %s, %s, 'FAILED', NOW(), %s)
            ON DUPLICATE KEY UPDATE
                SyncStatus = 'FAILED',
                LastSyncedAt = NOW(),
                LastError = VALUES(LastError)
            """,
            (entity_type, human_table_name, int(human_record_id), human_table_name, int(human_record_id), last_error),
        )
        conn.commit()
        cursor.execute(
            """
            SELECT MappingID
            FROM entity_mappings
            WHERE EntityType = %s AND HumanTableName = %s AND HumanRecordID = %s
            """,
            (entity_type, human_table_name, int(human_record_id)),
        )
        row = cursor.fetchone()
        return row["MappingID"] if row else None
    finally:
        conn.close()


def insert_sync_log(
    sync_batch_id,
    entity_type,
    entity_id,
    action,
    status,
    message,
    mapping_id=None,
    old_value=None,
    new_value=None,
    retry_count=0,
    source_system_code=SOURCE_SYSTEM_CODE,
    target_system_code=TARGET_SYSTEM_CODE,
):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO sync_logs
            (SyncBatchID, MappingID, EntityType, EntityID, Action, Status,
             SourceSystemCode, TargetSystemCode, OldValue, NewValue, Message, RetryCount)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                sync_batch_id,
                mapping_id,
                entity_type,
                int(entity_id),
                action,
                _log_status(status),
                source_system_code,
                target_system_code,
                _to_json(old_value),
                _to_json(new_value),
                message,
                retry_count,
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_sync_logs(limit=100):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                sl.SyncLogID AS id,
                sl.SyncBatchID AS sync_batch_id,
                sb.SyncType AS sync_type,
                sb.Direction AS direction,
                sb.Status AS batch_status,
                sl.MappingID AS mapping_id,
                sl.EntityType AS entity_type,
                sl.EntityID AS entity_id,
                sl.Action AS action,
                sl.Status AS status,
                sl.SourceSystemCode AS source_system_code,
                sl.TargetSystemCode AS target_system_code,
                sl.OldValue AS old_value,
                sl.NewValue AS new_value,
                sl.Message AS message,
                sl.RetryCount AS retry_count,
                sl.CreatedAt AS time
            FROM sync_logs sl
            JOIN sync_batches sb ON sb.SyncBatchID = sl.SyncBatchID
            ORDER BY sl.CreatedAt DESC
            LIMIT %s
            """,
            (int(limit),),
        )
        return cursor.fetchall()
    finally:
        conn.close()


def get_sync_batches(limit=100):
    conn = get_auth_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                sb.SyncBatchID AS id,
                sb.StartedByUserID AS started_by_user_id,
                COALESCE(u.Username, u.FullName, u.Email, 'system') AS started_by,
                sb.SyncType AS sync_type,
                sb.Direction AS direction,
                sb.Status AS status,
                sb.TotalRecords AS total_records,
                sb.SuccessRecords AS success_records,
                sb.FailedRecords AS failed_records,
                sb.StartedAt AS started_at,
                sb.FinishedAt AS finished_at
            FROM sync_batches sb
            LEFT JOIN users u ON u.UserID = sb.StartedByUserID
            ORDER BY sb.StartedAt DESC
            LIMIT %s
            """,
            (int(limit),),
        )
        return cursor.fetchall()
    finally:
        conn.close()


def get_hr_employees():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT EmployeeID, FullName, DepartmentID, PositionID, Status
            FROM Employees
            """
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_hr_departments():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DepartmentID, DepartmentName
            FROM Departments
            """
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_hr_positions():
    conn = get_sqlserver_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT PositionID, PositionName
            FROM Positions
            """
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def upsert_payroll_employee(employee):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO employees_payroll
            (EmployeeID, FullName, DepartmentID, PositionID, Status, SyncedAt)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                FullName = VALUES(FullName),
                DepartmentID = VALUES(DepartmentID),
                PositionID = VALUES(PositionID),
                Status = VALUES(Status),
                SyncedAt = NOW()
            """,
            (
                employee["EmployeeID"],
                employee["FullName"],
                employee["DepartmentID"],
                employee["PositionID"],
                employee["Status"],
            ),
        )
        conn.commit()
        return employee["EmployeeID"]
    finally:
        conn.close()


def upsert_payroll_department(department):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO departments_payroll
            (DepartmentID, DepartmentName, SyncedAt)
            VALUES (%s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                DepartmentName = VALUES(DepartmentName),
                SyncedAt = NOW()
            """,
            (department["DepartmentID"], department["DepartmentName"]),
        )
        conn.commit()
        return department["DepartmentID"]
    finally:
        conn.close()


def upsert_payroll_position(position):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO positions_payroll
            (PositionID, PositionName, SyncedAt)
            VALUES (%s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                PositionName = VALUES(PositionName),
                SyncedAt = NOW()
            """,
            (position["PositionID"], position["PositionName"]),
        )
        conn.commit()
        return position["PositionID"]
    finally:
        conn.close()
