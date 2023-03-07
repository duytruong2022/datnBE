export enum SecurityPermissions {
    ACCESS_PROJECT_LOGS = 'ACCESS_PROJECT_LOGS',
    ACCESS_PROJECT_LOGS_REPORTS = 'ACCESS_PROJECT_LOGS_REPORTS',
    ASSIGN_USER_GROUP_TO_PROJECT = 'ASSIGN_USER_GROUP_TO_PROJECT',
    MANAGE_USERS_GROUPS = 'MANAGE_USERS_GROUPS',
    ASSIGN_SECURITY_PROFILE = 'ASSIGN_SECURITY_PROFILE',
    CONFIG_LDAP = 'CONFIG_LDAP',
    IMPORT_CSV = 'IMPORT_CSV',
    CREATE_SECURITY_PROFILE = 'CREATE_SECURITY_PROFILE',
    CREATE_PROJECT = 'CREATE_PROJECT',
    ACCESS_DASHBOARD = 'ACCESS_DASHBOARD',
    ACCESS_NOTIFICATION = 'ACCESS_NOTIFICATION',
    HELP_VIEW_ALL = 'HELP_VIEW_ALL',
}

export const securityProfileListAttributes = [
    '_id',
    'name',
    'description',
    'permissions',
    'isDefaultSelect',
    'createdAt',
    'createdBy',
];

export const SecurityProfileOrderby = ['createdAt', 'name', 'isDefaultSelect'];
