import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
    Notification,
    NotificationDocument,
} from '../mongo-schemas/notification.schema';
import {
    MODULE_NAME,
    NotificationStatus,
    NotificationTypes,
    OrderBy,
} from '../notification.constant';
import {
    IGetNotification,
    INotification,
    IRejectNotification,
} from '../notification.interface';
import {
    AccessModules,
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    OrderDirection,
    softDeleteCondition,
    softDeleteConditionForAggregate,
    UserRoles,
    UserStatus,
} from 'src/common/constants';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import {
    getAccessModules,
    hasSecurityPermissions,
} from 'src/common/helpers/commonFunctions';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
const notificationAttributes = [
    'type',
    'status',
    'accessModules',
    'requestedUser',
    'projectOwner',
    'project',
    'fromUserId',
];

@Injectable()
export class NotificationMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getNotificationList(query: IGetNotification) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                orderBy = OrderBy.CREATED_AT,
                orderDirection = OrderDirection.DESCENDING,
                status = undefined,
                accessModules = [],
                keyword = '',
                projectId = '',
            } = query;
            const userQuery = {};
            const projectQuery = {};
            const notificationQuery = {
                ...softDeleteConditionForAggregate,
            };
            if (status) {
                Object.assign(notificationQuery, {
                    ...notificationQuery,
                    status,
                });
            }
            if (projectId.length) {
                Object.assign(notificationQuery, {
                    ...notificationQuery,
                    projectId: new ObjectId(projectId),
                });
            }

            if (keyword.length) {
                Object.assign(userQuery, {
                    ...userQuery,
                    $or: [
                        {
                            'user.fullName': {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                        {
                            'user.email': {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                    ],
                });
                Object.assign(projectQuery, {
                    ...projectQuery,
                    $or: [
                        {
                            'project.name': {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                        {
                            projectManagerNames: {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                    ],
                });
            }

            if (accessModules.length) {
                Object.assign(notificationQuery, {
                    ...notificationQuery,
                    accessModules: {
                        $in: accessModules,
                    },
                });
            }

            const aggregateQuery = [
                {
                    $match: notificationQuery,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'fromUserId',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'updatedBy',
                        foreignField: '_id',
                        as: 'updatedByUser',
                    },
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $addFields: {
                        'user.fullName': {
                            $concat: ['$user.firstName', ' ', '$user.lastName'],
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'projects',
                        localField: 'projectId',
                        foreignField: '_id',
                        as: 'project',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'project.adminId',
                        foreignField: '_id',
                        as: 'projectAdmin',
                    },
                },
                {
                    $project: {
                        type: 1,
                        rejectReason: 1,
                        'updatedByUser.firstName': 1,
                        'updatedByUser.lastName': 1,
                        'project.name': 1,
                        createdAt: 1,
                        'user.fullName': 1,
                        'user.email': 1,
                        'user._id': 1,
                        'projectAdmin.email': 1,
                    },
                },
                {
                    $match: {
                        $or: [userQuery, projectQuery],
                    },
                },
            ];

            const [items, totalItems] = await Promise.all([
                this.notificationModel.aggregate([
                    ...aggregateQuery,
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.ASCENDING
                                    ? 1
                                    : -1,
                        },
                    },
                    {
                        $skip: (page - 1) * limit,
                    },
                    {
                        $limit: +limit,
                    },
                ]),
                this.notificationModel.aggregate([
                    ...aggregateQuery,
                    {
                        $group: {
                            _id: 'null',
                            cnt: {
                                $sum: 1,
                            },
                        },
                    },
                ]),
            ]);
            return [items, totalItems?.[0]?.cnt];
        } catch (error) {
            this.logger.error('Error in get user notifications service', error);
            throw error;
        }
    }

    async getNotificationById(_id: ObjectId) {
        try {
            const notification = await this.notificationModel
                .findOne({ _id, ...softDeleteCondition })
                .select(notificationAttributes);
            return notification;
        } catch (error) {
            this.logger.error('Error in get notification by id', error);
            throw error;
        }
    }

    async rejectNotification(
        id: ObjectId,
        notificationType: NotificationTypes,
        data: IRejectNotification,
        userId: ObjectId,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.notificationModel.updateOne(
                { _id: id, ...softDeleteCondition },
                { ...data },
                {
                    session,
                },
            );
            if (notificationType === NotificationTypes.REGISTER) {
                await this.userModel.updateOne(
                    {
                        _id: userId,
                    },
                    {
                        status: UserStatus.REJECTED,
                        deletedAt: new Date(),
                        deletedBy: data.updatedBy,
                    },
                    {
                        session,
                    },
                );
            }
            await session.commitTransaction();
            return await this.getNotificationById(id);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in get notification by id', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async createNotification(notificationData: INotification) {
        try {
            const notification = new this.notificationModel(notificationData);
            return await notification.save();
        } catch (error) {
            this.logger.error('Error in create notifications service', error);
            throw error;
        }
    }

    async isNotificationIdsValid(notificationIds: string[], userId: string) {
        try {
            const notificationCount =
                await this.notificationModel.countDocuments({
                    ...softDeleteCondition,
                    _id: {
                        $in: notificationIds,
                    },
                    userIds: userId,
                });
            return notificationCount === notificationIds.length;
        } catch (error) {
            this.logger.error(
                'Error in is notification ids exist service',
                error,
            );
            throw error;
        }
    }

    async approveNotification(userId: ObjectId, updatedBy: ObjectId) {
        try {
            await this.notificationModel.updateOne(
                {
                    fromUserId: userId,
                    ...softDeleteCondition,
                },
                { status: NotificationStatus.APPROVED, updatedBy },
            );
        } catch (error) {
            this.logger.error('Error in get notification by id', error);
            throw error;
        }
    }

    async countPendingNotifiction(accessModules: AccessModules[]) {
        try {
            return await this.notificationModel.countDocuments({
                status: NotificationStatus.PENDING,
                accessModules: {
                    $in: accessModules,
                },
                ...softDeleteCondition,
            });
        } catch (error) {
            throw error;
        }
    }

    async removeNotificationsByUser(
        userId: ObjectId,
        deletedBy: ObjectId,
    ): Promise<void> {
        try {
            await this.notificationModel.updateMany(
                {
                    fromUserId: userId,
                    status: {
                        $in: [
                            NotificationStatus.PENDING,
                            NotificationStatus.APPROVED,
                        ],
                    },
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    checkUserHavePermission(loginUser: User, accessModule: AccessModules[]) {
        const userAdminAccessModules = getAccessModules(
            loginUser.accessModules,
            UserRoles.ADMIN,
        );

        if (
            (accessModule.includes(AccessModules.SPACIALYTIC_PLATFORM) &&
                !userAdminAccessModules.includes(
                    AccessModules.SPACIALYTIC_PLATFORM,
                )) ||
            (accessModule.includes(AccessModules.SPACIALYTIC_CONSTELLATION) &&
                !hasSecurityPermissions(loginUser, [
                    SecurityPermissions.ACCESS_NOTIFICATION,
                ])) ||
            (accessModule.includes(AccessModules.SPACIALYTIC_3DWEBVIEWER) &&
                !userAdminAccessModules.includes(
                    AccessModules.SPACIALYTIC_3DWEBVIEWER,
                ))
        ) {
            return false;
        }
        return true;
    }
}
