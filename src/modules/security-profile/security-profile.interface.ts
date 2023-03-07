import { ObjectId } from 'bson';
import { ICommonListQuery } from 'src/common/interfaces';
import { SecurityPermissions } from './security-profile.constant';

export type ISecurityProfileQuery = Partial<ICommonListQuery>;

export interface ICreateSecurityProfileBody {
    name: string;
    permissions: SecurityPermissions;
    description: string | null;
    createdBy?: ObjectId;
    isDefaultSelect?: boolean;
}

export interface IUpdateSecurityProfleBody extends ICreateSecurityProfileBody {
    updatedBy?: ObjectId;
}
