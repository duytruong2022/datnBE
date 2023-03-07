import { ObjectId } from 'bson';
import { AccessModules } from 'src/common/constants';
import { ICommonListQuery } from 'src/common/interfaces';
import { ProjectPermissions } from './project-profile.constant';

export interface ICreateProfileBody {
    name: string;
    isDefaultSelect: boolean;
    description: string;
    projectId: ObjectId;
    accessModule: AccessModules;
    permissions: ProjectPermissions[];
    createdBy?: ObjectId;
}

export interface IUpdateProfileBody extends ICreateProfileBody {
    updatedBy?: ObjectId;
}

export interface IGetListProfileQueryString extends ICommonListQuery {
    projectId?: ObjectId;
}
