export enum ProjectLogModules {
    USER = 'USER',
    PROJECT = 'PROJECT',
    PROJECT_PROFILE = 'PROJECT_PROFILE',
    PBS_GROUP = 'PBS_GROUP',
    PROJECT_GROUP = 'PROJECT_GROUP',
    GROUP = 'GROUP',
}

export enum ProjectLogActions {
    CREATE_PROJECT = 'CREATE_PROJECT',
    UPDATE_PROJECT = 'UPDATE_PROJECT',
    DELETE_PROJECT = 'DELETE_PROJECT',
    CREATE_PROJECT_GROUP = 'CREATE_PROJECT_GROUP',
    UPDATE_PROJECT_GROUP = 'UPDATE_PROJECT_GROUP',
    DELETE_PROJECT_GROUP = 'DELETE_PROJECT_GROUP',
    CREATE_PROJECT_PROFILE = 'CREATE_PROJECT_PROFILE',
    UPDATE_PROJECT_PROFILE = 'UPDATE_PROJECT_PROFILE',
    DELETE_PROJECT_PROFILE = 'DELETE_PROJECT_PROFILE',
    CREATE_USER = 'CREATE_USER',
    UPDATE_USER = 'UPDATE_USER',
    DELETE_USER = 'DELETE_USER',
    ASSIGN_TO_PROJECT_USER = 'ASSIGN_TO_PROJECT_USER',
    REMOVE_FROM_PROJECT_USER = 'REMOVE_FROM_PROJECT_USER',
    ASSIGN_TO_PROJECT_GROUP = 'ASSIGN_TO_PROJECT_GROUP',
    REMOVE_FROM_PROJECT_GROUP = 'REMOVE_FROM_PROJECT_GROUP',
}

export enum LogServerType {
    INSTANCE_LOG = 'INSTANCE_LOG',
    SERVER_LOG = 'SERVER_LOG',
    LICENSE_LOG = 'LICENSE_LOG',
}
