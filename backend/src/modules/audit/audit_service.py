from .audit_repository import (
    create_audit_log,
    create_audit_log_from_user,
    get_audit_logs,
)


def list_audit_logs(action=None, module=None, username=None, limit=100):
    return get_audit_logs(action, module, username, limit)


def log_action(
    action,
    module,
    detail,
    user_id=None,
    username="system",
    role_name="system",
    target_type=None,
    target_id=None,
    sync_batch_id=None,
    sync_log_id=None,
    old_value=None,
    new_value=None,
    ip_address=None,
    user_agent=None,
    status="SUCCESS",
):
    return create_audit_log(
        action=action,
        module=module,
        detail=detail,
        user_id=user_id,
        username=username,
        role_name=role_name,
        target_type=target_type,
        target_id=target_id,
        sync_batch_id=sync_batch_id,
        sync_log_id=sync_log_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
    )


def log_user_action(
    action,
    module,
    detail,
    user_context=None,
    target_type=None,
    target_id=None,
    sync_batch_id=None,
    sync_log_id=None,
    old_value=None,
    new_value=None,
    ip_address=None,
    user_agent=None,
    status="SUCCESS",
):
    return create_audit_log_from_user(
        action=action,
        module=module,
        detail=detail,
        user_context=user_context,
        target_type=target_type,
        target_id=target_id,
        sync_batch_id=sync_batch_id,
        sync_log_id=sync_log_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
    )
