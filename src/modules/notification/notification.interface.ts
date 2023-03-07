import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { AccessModules, OrderDirection } from 'src/common/constants';
import {
    NotificationStatus,
    NotificationTypes,
    OrderBy,
} from './notification.constant';

export interface INotification {
    accessModules: AccessModules[];
    type: NotificationTypes;
    isRead?: boolean;
    param?: string;
    fromUserId: Types.ObjectId;
    createdBy?: Types.ObjectId;
    projectOwnerId?: Types.ObjectId;
    projectId?: Types.ObjectId;
    status?: NotificationStatus;
}

export interface IGetNotification {
    page?: number;
    limit?: number;
    keyword?: string;
    orderBy: OrderBy;
    orderDirection: OrderDirection;
    status?: NotificationStatus;
    accessModules: AccessModules[];
    projectId?: string;
}

export interface IRejectNotification {
    rejectReason?: string;
    updatedBy?: ObjectId;
    status?: NotificationStatus;
}

export interface ICountPendingNotification {
    accessModules: AccessModules[];
}
