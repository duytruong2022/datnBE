import { ObjectId } from 'mongodb';
import { AccessModules } from 'src/common/constants';
import { ICommonListQuery, IFile } from 'src/common/interfaces';

export interface ICreateSupportRequest {
    email: string;
    firstName: string;
    lastName: string;
    category: string;
    priority: string;
    version: string;
    site: string;
    object: string;
    reference: string;
    detail: string;
    createdBy: ObjectId;
    accessModule: AccessModules;
    file: IFile;
}

export interface IUpdateSupportRequest {
    email: string;
    firstName: string;
    lastName: string;
    category: string;
    priority: string;
    version: string;
    site: string;
    object: string;
    reference: string;
    detail: string;
    file: IFile;
    updatedBy: ObjectId;
}

export interface ISupportRequestListQuery extends ICommonListQuery {
    categories: string[];
    sites: string[];
    priorities: string[];
    accessModule: AccessModules;
    createdBy?: ObjectId | null;
}

export interface ISupportRequestExportListQuery
    extends ISupportRequestListQuery {
    socketClientId: string;
    createdBy?: ObjectId | null;
}
