import { AccessModules } from './../../common/constants';
import { ObjectId } from 'mongodb';
import { ICommonListQuery } from 'src/common/interfaces';
import { UpdateGroupAction } from './group.constant';

export interface IGroupCreateBody {
    name: string;
    securityProfileId?: ObjectId;
    viewer3dProfileId?: ObjectId;
    description: string;
    accessModule: AccessModules;
    createdBy: ObjectId;
}

export interface IGroupUpdateBody {
    name?: string;
    securityProfileId?: ObjectId;
    viewer3dProfileId?: ObjectId;
    projectIds?: ObjectId[];
    description?: string;
    updatedBy?: ObjectId;
    deletedAt?: Date;
    deletedBy?: ObjectId;
}

export interface IGroupUpdateProfileBody {
    securityProfileId?: ObjectId;
    viewer3dProfileId?: ObjectId;
    updatedBy?: ObjectId;
}

export interface IGroupUpdateProjectProfileBody {
    newProjectProfileId: ObjectId;
    oldProjectProfileId: ObjectId;
    updatedBy?: ObjectId;
}

export interface IGroupUpdateProjectIdsBody {
    action: UpdateGroupAction;
    projectId: ObjectId;
    updatedBy?: string;
}
export interface IGroupListQuery extends ICommonListQuery {
    accessModule?: AccessModules;
    profileIds?: ObjectId[];
}

export interface IBulkCreateGroup {
    index?: number;
    name: string;
    securityProfile?: string;
    viewer3dProfile?: string;
    securityProfileId?: ObjectId;
    viewer3dProfileId?: ObjectId;
    description: string;
    accessModule: AccessModules;
}

export interface IBulkCreateGroupBody {
    groups: IBulkCreateGroup[];
    accessModule: AccessModules;
}
