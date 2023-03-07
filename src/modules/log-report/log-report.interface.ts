import { ObjectId } from 'mongodb';
import { AccessModules } from 'src/common/constants';

export interface IUserTimeListQuery {
    company?: string;
    dateRanges?: string[];
    projectId?: string;
    dateRangeType: string;
}

export interface ISupportRequestCategoryListQuery {
    dateRanges?: string[];
    dateRangeType: string;
}

export interface IUserStatusListQuery {
    module?: AccessModules;
    projectId?: ObjectId;
    company?: string;
}

export interface IUserInCompanyListQuery {
    dateRanges?: string[];
    dateRangeType?: string;
    projectId?: ObjectId;
}
