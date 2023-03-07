// TODO: add fulllist later
export enum AuditLogActions {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    ACTIVE = 'ACTIVE',
    REGISTER = 'REGISTER',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    REJECT = 'REJECT',
    DELETE_TOKEN = 'DELETE_TOKEN',
    RESET_PASSWORD = 'RESET_PASSWORD',
}

export enum AuditLogModules {
    AUTH = 'AUTH',
    USER = 'USER',
    GROUP = 'GROUP',
    PROJECT = 'PROJECT',
    SECURITY_PROFILE = 'SECURITY_PROFILE',
    PROJECT_PROFILE = 'PROJECT_PROFILE',
    NOTIFICATION = 'NOTIFICATION',
    PBS_GROUP = 'PBS_GROUP',
    PROJECT_GROUP = 'PROJECT_GROUP',
    SUPPORT_REQUEST = 'SUPPORT_REQUEST',
    BASELINE_PLANNING = 'BASELINE_PLANNING',
}