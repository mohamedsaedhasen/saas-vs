// Security Logger Helper
// Use this to log login events and security events

interface LogLoginParams {
    userId?: string;
    userEmail: string;
    userName: string;
    eventType: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'token_refresh';
    status: 'success' | 'failed';
    failureReason?: string;
}

export async function logLogin(params: LogLoginParams): Promise<void> {
    try {
        await fetch('/api/logs/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: params.userId,
                user_email: params.userEmail,
                user_name: params.userName,
                event_type: params.eventType,
                status: params.status,
                failure_reason: params.failureReason,
            }),
        });
    } catch (error) {
        console.error('Failed to log login event:', error);
    }
}

interface LogSecurityParams {
    userId?: string;
    userName?: string;
    eventType: string;
    description: string;
    resourceType?: string;
    resourceId?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}

export async function logSecurityEvent(params: LogSecurityParams): Promise<void> {
    try {
        await fetch('/api/logs/security', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: params.userId,
                user_name: params.userName,
                event_type: params.eventType,
                description: params.description,
                resource_type: params.resourceType,
                resource_id: params.resourceId,
                old_value: params.oldValue,
                new_value: params.newValue,
                severity: params.severity || 'medium',
            }),
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

// Predefined security event types
export const SecurityEventTypes = {
    PASSWORD_CHANGE: 'password_change',
    EMAIL_CHANGE: 'email_change',
    PHONE_CHANGE: 'phone_change',
    TWO_FA_ENABLED: '2fa_enabled',
    TWO_FA_DISABLED: '2fa_disabled',
    ROLE_CHANGE: 'role_change',
    PERMISSION_CHANGE: 'permission_change',
    DATA_EXPORT: 'data_export',
    BULK_DELETE: 'bulk_delete',
    SETTINGS_CHANGE: 'settings_change',
    API_KEY_GENERATED: 'api_key_generated',
    API_KEY_REVOKED: 'api_key_revoked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
};
