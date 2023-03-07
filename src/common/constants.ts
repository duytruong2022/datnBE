import Joi from '../plugins/joi';
import dotenv from 'dotenv';
dotenv.config();

export enum Languages {
    EN = 'en',
    FR = 'fr',
}

export const DEFAULT_LANGUAGE = Languages.EN;

export enum OrderDirection {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum OrderBy {
    ID = '_id',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export enum UserTokenTypes {
    REFRESH_TOKEN = 'refresh_token',
    ACTIVE_USER = 'active_user',
    RESET_PASSWORD = 'reset_password',
}

export const TIMEZONE_HEADER = 'x-timezone';
export const TIMEZONE_NAME_HEADER = 'x-timezone-name';

export const DEFAULT_LIMIT_FOR_DROPDOWN = 1000;
export const DEFAULT_LIMIT_FOR_PAGINATION = 10;
export const DEFAULT_FIRST_PAGE = 1;
export const DEFAULT_ORDER_BY = 'createdAt';
export const DEFAULT_ORDER_DIRECTION = 'desc';
export const DEFAULT_MIN_DATE = '1970-01-01 00:00:00';
export const DEFAULT_MAX_DATE = '3000-01-01 00:00:00';

export const INTEGER_POSITIVE_MIN_VALUE = 1;
export const INTEGER_POSITIVE_MAX_VALUE = 4294967295;
export const MAX_PAGE_LIMIT = 10000; // max item per one page

export const INPUT_TEXT_MAX_LENGTH = 255;
export const TEXTAREA_MAX_LENGTH = 2000;
export const ARRAY_MAX_LENGTH = 500;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 64;

export const COLOR_CODE_MAX_LENGTH = 7;

export const Regex = {
    URI: /^https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/,
    EMAIL: /^(([a-zA-Z0-9 +]+)([.-]{1})?)*[a-zA-Z0-9]@([a-zA-Z0-9 -]+[.])+[a-zA-Z0-9]+$/,
    NUMBER: /^(?:[0-9]\d*|)$/,
    PHONE_NUMBER: /^([0-9 +-]){3,40}$/,
    CODE: /^[a-zA-Z\-_0-9]+$/,
    PASSWORD: /^.*([a-zA-Z].*[0-9]|[0-9].*[a-zA-Z]).*$/,
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    FILE_NAME: /^(?!.*\.$)(?!.*\.\.)[a-zàâçéèêëîïôûùüÿñæœ0-9_.()-\s']+$/i,
    FOLDER_NAME: /^(?!.*\.$)(?!.*\.\.)[a-zàâçéèêëîïôûùüÿñæœ0-9_.()-\s']+$/i,
    FILE_PATH: /^(?!.*\.$)(?!.*\.\.)[a-zàâçéèêëîïôûùüÿñæœ0-9_.()-\/\s']+$/i,
    FOLDER_PATH: /^(?!.*\.$)(?!.*\.\.)[a-zàâçéèêëîïôûùüÿñæœ0-9\/_.-\s]+$/i,
    COLOR: /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
    firstChildFolderRegex: /^\/[^/]*$/,
};

export enum DateFormat {
    YYYY_MM_DD_HYPHEN = 'YYYY-MM-DD',
    HH_mm_ss_COLON = 'HH:mm:ss',
    YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON = 'YYYY-MM-DD HH:mm:ss',
}

export const CommonListQuerySchema = {
    page: Joi.number().positive().optional().allow(null),
    limit: Joi.number().positive().max(MAX_PAGE_LIMIT).optional().allow(null),
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    orderDirection: Joi.string()
        .valid(...Object.values(OrderDirection))
        .optional(),
    orderBy: Joi.string()
        .valid(...Object.values(OrderBy))
        .optional(),
};

export enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    INVALID_USERNAME_OR_PASSWORD = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    GROUP_HAS_CHILDREN = 410,
    GROUP_MAX_QUANTITY = 412,
    EXCEED_LIMIT = 413,
    FAILED_DEPENDENCY = 424,
    ITEM_NOT_FOUND = 444,
    ITEM_ALREADY_EXIST = 445,
    ITEM_INVALID = 446,
    ITEM_IS_USING = 447,
    USER_HAVE_NOT_PERMISSION = 448,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503,
}

export enum MongoCollection {
    USERS = 'users',
    USER_TOKENS = 'user_tokens',
    AUDIT_LOGS = 'audit_logs',
    GROUPS = 'groups',
    SECURITY_PROFILES = 'security_profiles',
    PROJECTS = 'projects',
    PROJECT_PLANNINGS = 'project_plannings',
    BASELINE_PLANNINGS = 'baseline_plannings',
    BASELINE_CONFIGURATIONS = 'baseline_configurations',
    PROJECT_TASKS = 'project_tasks',
    PROJECT_PROFILES = 'project_profiles',
    '3D_VIEWER_PROFILES' = '3d_viewer_profiles',
    '3D_VIEWER_FILES' = '3d_viewer_files',
    '3D_VIEWER_SESSIONS' = '3d_viewer_sessions',
    PROJECT_LOGS = 'project_logs',
    ACCESS_LOGS = 'access_logs',
    COUNTRIES = 'countries',
    NOTIFICATIONS = 'notifications',
    USER_REGISTER_HISTORIES = 'user_register_histories',
    PBS_GROUPS = 'pbs_groups',
    PROJECT_FILES = 'project_files',
    PROJECT_GROUPS = 'project_groups',
    FILE_THUMBNAILS = 'file_thumbnails',
    GENERAL_SETTINGS = 'general_settings',
    LDAP_USERS = 'ldap_users',
    SUPPORT_REQUESTS = 'support_requests',
    WORKING_3D_VIEWER_FILES = 'working_3d_viewer_files',
    PROJECT_RESOURCES = 'project_resources',
    PROJECT_RESOURCE_GROUPS = 'project_resource_groups',
    PROJECT_APPEARANCE_PROFILE = 'project_appearance_profile',
    ACTIVITY_CODES = 'activity_codes',
    PROJECT_FIELD_SETTINGS = 'project_field_settings',
    PROJECT_CALENDAR_CONFIGS = 'project_calendar_configs',
    PROJECT_CALENDARS = 'project_calendars',
    PROJECT_CALENDAR_DAY_TYPES = 'project_calendar_day_types',
    PROJECT_NOTIFICATIONS = 'project_notifications',
    ACTIVITY_CODE_VALUES = 'activity_code_values',
}

export enum UserStatus {
    REGISTERING = 'registering',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    REJECTED = 'rejected',
}

export enum AccessModules {
    SPACIALYTIC_PLATFORM = 'spacialytic_platform',
    SPACIALYTIC_3DWEBVIEWER = 'spacialytic_3dwebviewer',
    SPACIALYTIC_CONSTELLATION = 'spacialytic_constellation',
}

export enum UserRoles {
    ADMIN = 'admin',
    NORMAL_USER = 'normal_user',
}

export enum Timezones {
    'GMT+00:00' = 'GMT+00:00',
    'GMT+01:00' = 'GMT+01:00',
    'GMT+02:00' = 'GMT+02:00',
    'GMT+03:00' = 'GMT+03:00',
    'GMT+04:00' = 'GMT+04:00',
    'GMT+05:00' = 'GMT+05:00',
    'GMT+06:00' = 'GMT+06:00',
    'GMT+07:00' = 'GMT+07:00',
    'GMT+08:00' = 'GMT+08:00',
    'GMT+09:00' = 'GMT+09:00',
    'GMT+10:00' = 'GMT+10:00',
    'GMT+11:00' = 'GMT+11:00',
    'GMT+12:00' = 'GMT+12:00',
    'GMT-01:00' = 'GMT-01:00',
    'GMT-02:00' = 'GMT-02:00',
    'GMT-03:00' = 'GMT-03:00',
    'GMT-04:00' = 'GMT-04:00',
    'GMT-05:00' = 'GMT-05:00',
    'GMT-06:00' = 'GMT-06:00',
    'GMT-07:00' = 'GMT-07:00',
    'GMT-08:00' = 'GMT-08:00',
    'GMT-09:00' = 'GMT-09:00',
    'GMT-10:00' = 'GMT-10:00',
    'GMT-11:00' = 'GMT-11:00',
}

export const softDeleteCondition = {
    $or: [
        {
            deletedAt: {
                $exists: true,
                $eq: null,
            },
        },
        {
            deletedAt: {
                $exists: false,
            },
        },
    ],
};

export const softDeleteConditionForAggregate = {
    deletedAt: null,
};

export const MAX_UPLOAD_FILE_SIZE_IN_BYTE = 20971520; // 20MB = 20971520B

export const SocketEvents = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WEB_APP_USER_LOGIN: 'web_app_user_login',
    WEB_APP_SUPPORT_REQUEST_EXPORT_CSV: 'web_app_support_request_export_csv',
};

export const rootFolderPath = '/';

export const defaultRootFolderLevel = 1;
export const maxFolderLevel = 8;
export const FILE_NAME_MAX_LENGTH = 200;

export enum RedisPrefixKey {
    ACCESS_TOKEN = 'accessToken',
}

export const customErrorMessagePrefix = 'custom_';

export const SundayWeekDay = 0;
export const SaturdayWeekDay = 6;
