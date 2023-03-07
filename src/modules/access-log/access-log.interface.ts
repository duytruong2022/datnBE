import { AccessModules } from '../../common/constants';
import { ICommonListQuery } from 'src/common/interfaces';
import { ObjectId } from 'mongodb';

export interface IAccessLogCreateBody {
    userId: ObjectId;
    module: AccessModules;
    loginAt: Date;
    logoutAt?: Date;
    createdBy: ObjectId;
    projectId?: ObjectId;
}

export interface IAccessLogUpdateBody {
    logoutAt?: Date;
    updatedBy: ObjectId;
}

export interface IAccessLogListQuery extends ICommonListQuery {
    modules?: AccessModules[];
    companies?: string[];
    loginAtRange?: string[];
}
