import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    ICreateProjectNotification,
    IGetProjectNotification,
} from '../project.interface';
import { ProjectNotification } from '../mongo-schemas/project-notification.schema';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    MongoCollection,
    OrderDirection,
} from 'src/common/constants';
export const projectFieldSettingAttributes = ['settings'];
@Injectable()
export class ProjectNotificationMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectNotification.name)
        private readonly projectNotificationModel: Model<ProjectNotification>,
    ) {}

    private readonly logger = createWinstonLogger(
        'project-planning-service',
        this.configService,
    );

    async createProjectNotification(data: ICreateProjectNotification) {
        try {
            const notification = new this.projectNotificationModel(data);
            notification.save();
        } catch (error) {
            this.logger.error(
                'Error in createProjectNotification service',
                error,
            );
            throw error;
        }
    }

    async getProjectNotificationList(query: IGetProjectNotification) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                projectId = '',
                type = null,
                keyword = '',
            } = query;
            const mongooseQuery = { projectId };
            if (type) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    type,
                });
            }
            const afterJoinUserQuery = {};
            if (keyword.length) {
                Object.assign(afterJoinUserQuery, {
                    ...afterJoinUserQuery,
                    $or: [
                        {
                            fullName: {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                        {
                            target: {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                    ],
                });
            }
            const [items, totalItems] = await Promise.all([
                this.projectNotificationModel.aggregate([
                    { $match: mongooseQuery as unknown as Expression },
                    {
                        $lookup: {
                            from: MongoCollection.USERS,
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'user',
                            pipeline: [
                                {
                                    $project: {
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: '$user',
                    },
                    {
                        $addFields: {
                            fullName: {
                                $concat: [
                                    '$user.firstName',
                                    ' ',
                                    '$user.lastName',
                                ],
                            },
                        },
                    },
                    { $match: afterJoinUserQuery as unknown as Expression },
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.ASCENDING
                                    ? 1
                                    : -1,
                        },
                    },
                    {
                        $skip: (page - 1) * +limit,
                    },
                    {
                        $limit: +limit,
                    },
                    {
                        $project: {
                            user: 1,
                            target: 1,
                            createdAt: 1,
                            type: 1,
                        },
                    },
                ]),
                this.projectNotificationModel.aggregate([
                    { $match: mongooseQuery as unknown as Expression },
                    {
                        $lookup: {
                            from: MongoCollection.USERS,
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'user',
                            pipeline: [
                                {
                                    $project: {
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: '$user',
                    },
                    {
                        $addFields: {
                            fullName: {
                                $concat: [
                                    '$user.firstName',
                                    ' ',
                                    '$user.lastName',
                                ],
                            },
                        },
                    },
                    { $match: afterJoinUserQuery as unknown as Expression },
                    {
                        $group: {
                            _id: null,
                            cnt: {
                                $sum: 1,
                            },
                        },
                    },
                ]),
            ]);
            return { items, totalItems: totalItems?.[0]?.cnt || 0 };
        } catch (error) {
            this.logger.error(
                'Error in getProjectNotificationList service',
                error,
            );
            throw error;
        }
    }
}
