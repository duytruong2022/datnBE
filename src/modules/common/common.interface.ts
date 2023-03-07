import { ObjectId } from 'mongodb';
import { AccessModules } from './../../common/constants';
export interface IQueryDropdown {
    page?: number;
    limit?: number;
    accessModule?: AccessModules;
    projectId?: ObjectId;
}

export interface IQueryDropdownByModules {
    page?: number;
    limit?: number;
    projectId?: ObjectId;
    accessModules?: AccessModules[];
}

export interface IQueryDropdownFile {
    type?: string[];
    projectId?: ObjectId;
}
