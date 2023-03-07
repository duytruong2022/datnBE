import { ObjectId } from 'mongodb';
import { ICommonListQuery } from 'src/common/interfaces';
import {
    LogServerType,
    ProjectLogActions,
    ProjectLogModules,
} from './project-log.constant';

export interface IProjectLogCreateBody {
    projectId: ObjectId;
    module: ProjectLogModules;
    action: ProjectLogActions;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    description: string;
    createdBy: ObjectId;
}

export interface IProjectLogListQuery extends ICommonListQuery {
    projectIds?: ObjectId[];
    modules: ProjectLogModules[];
    keyword?: string;
    actions?: ProjectLogActions[];
    updatedAtRange?: string[];
}

export interface IServerLogGetListQuery {
    date: string;
    type: LogServerType;
}

export interface IServerLogGetDetailQuery {
    path: string;
}
