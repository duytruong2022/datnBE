export const MODULE_NAME = 'group';

export enum GroupOrderBy {
    NAME = 'name',
    CREATED_AT = 'createdAt',
}

export enum UpdateGroupAction {
    ASSIGN_USER = 'assignUser',
    REMOVE_USER = 'removeUser',
    ASSIGN_PROJECT = 'assignProject',
    REMOVE_PROJECT = 'removeProject',
}
