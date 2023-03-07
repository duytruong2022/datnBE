export const MODULE_NAME = 'notification';
export enum OrderBy {
    CREATED_AT = 'createdAt',
}
export enum NotificationTypes {
    REGISTER = 'register',
    LDAP_IMPORT = 'ldap_import',
    RESET_PASSWORD = 'reset_password',
}
export enum NotificationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
