export enum SupportRequestCategory {
    INCIDENT = 'incident',
    REQUEST = 'request',
    IDEA_SUGGESTION = 'idea_suggestion',
}

export enum SupportRequestSite {
    SPACIALYTIC_PLATFORM = 'spacialytic_platform',
    SPACIALYTIC_3DWEBVIEWER = 'spacialytic_3dwebviewer',
    SPACIALYTIC_CONSTELLATION = 'spacialytic_constellation',
}
export enum SupportRequestPriority {
    HIGHT = 'hight',
    MEDIUM = 'medium',
    LOW = 'low',
}

export enum SupportRequestOrderBy {
    EMAIL = 'email',
    CREATED_AT = 'createdAt',
}

export const EXPORT_CSV_FILE_NAME = 'support_request';

export const exportColumns = [
    'email',
    'firstName',
    'lastName',
    'category',
    'priority',
    'version',
    'site',
    'object',
    'reference',
    'detail',
];
export const i18KeyExportColumns = ['category', 'priority', 'site'];
export const i18ExportKey = 'support-request.exportData';
