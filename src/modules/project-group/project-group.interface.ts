import { ObjectId } from 'mongodb';
import { AccessModules } from 'src/common/constants';
import { ICommonListQuery } from 'src/common/interfaces';

export interface IProjectGroupCreateBody {
    name: string;
    projectId: ObjectId;
    projectProfileId?: ObjectId;
    description: string;
    createdBy: ObjectId;
}

export interface IProjectGroupUpdateBody {
    name?: string;
    projectProfileId?: ObjectId;
    description?: string;
    updatedBy?: ObjectId;
    deletedAt?: Date;
    deletedBy?: ObjectId;
}

export interface IProjectGroupListQuery extends ICommonListQuery {
    accessModule?: AccessModules;
    projectId: ObjectId;
    profileIds?: ObjectId[];
}

export interface IBulkCreateProjectGroup {
    index?: number;
    name: string;
    projectProfile?: string;
    projectProfileId?: ObjectId;
    description: string;
    accessModule: AccessModules;
    projectId: string;
}

export interface IBulkCreateProjectGroupBody {
    groups: IBulkCreateProjectGroup[];
    accessModule: AccessModules;
    projectId: string;
}

export interface IUserNotInProjectGroupBody extends ICommonListQuery {
    projectId: string;
    accessModule: AccessModules;
}

export interface IProjectGroupUpdateProfileBody {
    projectProfileId?: ObjectId;
}

export interface IAssignResource {
    resourceIds: ObjectId[];
    taskIds: ObjectId[];
    path?: string;
    projectId?: ObjectId;
}

export interface IAssignResourceGroup {
    resourceGroupIds: ObjectId[];
    taskIds: ObjectId[];
    path?: string;
    projectId?: ObjectId;
}
