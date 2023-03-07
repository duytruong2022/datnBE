export const MODULE_NAME = 'user';

export enum UserOrderBy {
    USERNAME = 'ldapUsername',
    CREATED_AT = 'createdAt',
    FULL_NAME = 'fullName',
}

export enum RegistrationFrom {
    SELF_REGISTER = 'self_register',
    ADMIN_CREATE = 'admin_create',
    CSV_IMPORT = 'csv_import',
    LDAP_IMPORT = 'ldap_import',
}

export const SENDGRID_SEND_MAIL_SUCCESS_CODE = 202;

export const RESET_PASSWORD_LENGTH = 20;
export const ACCOUNT_ACTIVATION_KEY_LENGTH = 20;
export const INPUT_NAME_MAX_LENGTH = 40;

export enum UpdateProjectUserAction {
    ASSIGN_PROJECT = 'assignProject',
    REMOVE_PROJECT = 'removeProject',
}

export const activeAccountKeyExpiredIn = 12; // in hours
