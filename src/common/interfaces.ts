import { ObjectId } from 'mongodb';
import { ProjectPermissions } from 'src/modules/3D-viewer-profile/viewer-3d-profile.constant';
import { OrderDirection } from './constants';

export interface IMongoKeywordCondition {
    $or: {
        [key: string]: {
            $regex: string;
            $options: string;
        };
    }[];
}

export interface ICommonListQuery {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: OrderDirection;
    keyword?: string;
}

// interface for user's data type which store in token
export interface IUserToken {
    _id: string;
    email: string;
    fullName: string;
}

export interface ISocketWepAppLogin {
    senderId: string;
    senderEmail: string;
}

export interface ITreeNode {
    _id: ObjectId;
    value?: ObjectId;
    level?: number;
    children?: ITreeNode[];
    parentId?: ObjectId;
    parentIds?: ObjectId[];
    label: string;
    data?: any;
}

export interface IFile {
    type: string;
    originalname: string;
    filename: string;
    path: string;
    size: number;
}

export interface IFileBody {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

export interface IExportCSVData {
    fileName: string;
    filePath: string;
}

export interface IPbsPermission {
    pbsGroupId: ObjectId;
    permissions: ProjectPermissions[];
}
