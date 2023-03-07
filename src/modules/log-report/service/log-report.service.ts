import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import {
    AccessModules,
    MongoCollection,
    softDeleteCondition,
    UserStatus,
} from 'src/common/constants';
import {
    AccessLog,
    AccessLogDocument,
} from 'src/modules/access-log/mongo-schemas/access-log.schema';
import { DateRangeTypes, MODULE_NAME } from '../log-report.constant';
import {
    ISupportRequestCategoryListQuery,
    IUserInCompanyListQuery,
    IUserStatusListQuery,
    IUserTimeListQuery,
} from '../log-report.interface';
import moment from 'moment';
import {
    Project,
    ProjectDocument,
} from 'src/modules/project/mongo-schemas/project.schema';
import {
    SupportRequest,
    SupportRequestDocument,
} from 'src/modules/support-request/mongo-schemas/support-request.schema';
import { SupportRequestCategory } from 'src/modules/support-request/support-request.constant';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
@Injectable()
export class LogReportMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(AccessLog.name)
        private readonly accessLogModel: Model<AccessLogDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(SupportRequest.name)
        private readonly supportRequestModel: Model<SupportRequestDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getUserTimeByModuleList(query: IUserTimeListQuery) {
        try {
            const {
                dateRanges = [],
                company = '',
                dateRangeType = DateRangeTypes.MONTH,
                projectId = '',
            } = query;

            let groupCondition;

            if (dateRangeType === DateRangeTypes.MONTH) {
                groupCondition = { month: { $month: '$loginAt' } };
            } else {
                groupCondition = { day: { $dayOfMonth: '$loginAt' } };
            }

            const accessLogs = await this.accessLogModel.aggregate([
                {
                    $lookup: {
                        from: MongoCollection.USERS,
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'userAccess',
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserTimeListBuilder({
                                dateRanges,
                                company,
                                projectId,
                            }),
                        ],
                    },
                },
                {
                    $group: {
                        _id: groupCondition,
                        userAccessTimes: {
                            $push: {
                                module: '$module',
                                projectId: '$projectId',
                                loginAt: '$loginAt',
                                logoutAt: '$logoutAt',
                            },
                        },
                    },
                },
            ]);

            const userTimes = accessLogs.map((accessLog) => {
                let platformModuleTime = 0;
                let constellationModuleTime = 0;
                let viewer3DProfileModuleTime = 0;
                let projectTime = 0;
                accessLog?.userAccessTimes?.forEach((userAccessTime) => {
                    if (userAccessTime.logoutAt && userAccessTime.loginAt) {
                        if (
                            userAccessTime.module ===
                            AccessModules.SPACIALYTIC_PLATFORM
                        ) {
                            platformModuleTime += moment(
                                userAccessTime.logoutAt,
                            ).diff(moment(userAccessTime.loginAt), 'hours');
                        } else if (
                            userAccessTime.module ===
                            AccessModules.SPACIALYTIC_CONSTELLATION
                        ) {
                            constellationModuleTime += moment(
                                userAccessTime.logoutAt,
                            ).diff(moment(userAccessTime.loginAt), 'hours');
                        } else if (
                            userAccessTime.module ===
                            AccessModules.SPACIALYTIC_3DWEBVIEWER
                        ) {
                            viewer3DProfileModuleTime += moment(
                                userAccessTime.logoutAt,
                            ).diff(moment(userAccessTime.loginAt), 'hours');
                        } else if (
                            projectId.length &&
                            userAccessTime.projectId.toString() ===
                                projectId.toString()
                        ) {
                            projectTime += moment(userAccessTime.logoutAt).diff(
                                moment(userAccessTime.loginAt),
                                'hours',
                            );
                        }
                    }
                });
                if (dateRangeType === DateRangeTypes.MONTH) {
                    return {
                        month: accessLog?._id?.month,
                        platformModuleTime,
                        constellationModuleTime,
                        viewer3DProfileModuleTime,
                        projectTime,
                    };
                } else {
                    return {
                        day: accessLog?._id?.day,
                        platformModuleTime,
                        constellationModuleTime,
                        viewer3DProfileModuleTime,
                        projectTime,
                    };
                }
            });
            return {
                items: userTimes,
            };
        } catch (error) {
            this.logger.error('Error in getAccessLogList service', error);
            throw error;
        }
    }

    generateUserTimeListBuilder({ dateRanges, company, projectId }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (dateRanges?.length) {
            conditions.push({
                loginAt: {
                    $gte: new Date(dateRanges[0]),
                },
            });
            conditions.push({
                loginAt: {
                    $lte: new Date(dateRanges[1]),
                },
            });
        }

        if (company) {
            conditions.push({
                'userAccess.company': company,
            });
        }

        if (projectId?.length) {
            conditions.push({
                projectId: new ObjectId(projectId),
            });
        }

        return conditions;
    }

    async getSupportRequestCategoryList(
        query: ISupportRequestCategoryListQuery,
    ) {
        try {
            const { dateRanges = [], dateRangeType = DateRangeTypes.MONTH } =
                query;

            let groupCondition;

            if (dateRangeType === DateRangeTypes.MONTH) {
                groupCondition = { month: { $month: '$createdAt' } };
            } else {
                groupCondition = { day: { $dayOfMonth: '$createdAt' } };
            }

            const supportRequests = await this.supportRequestModel.aggregate([
                {
                    $match: {
                        $and: [
                            ...this.generateProjectCategoryListBuilder({
                                dateRanges,
                            }),
                        ],
                    },
                },
                {
                    $group: {
                        _id: groupCondition,
                        supportRequestCategories: {
                            $push: {
                                category: '$category',
                            },
                        },
                    },
                },
            ]);

            const userTimes = supportRequests.map((supportRequest) => {
                let incidentCount = 0;
                let requestCount = 0;
                let ideaSuggestionCount = 0;
                supportRequest.supportRequestCategories?.forEach(
                    (supportRequestCategory) => {
                        if (
                            supportRequestCategory.category ===
                            SupportRequestCategory.INCIDENT
                        ) {
                            incidentCount++;
                        } else if (
                            supportRequestCategory.category ===
                            SupportRequestCategory.REQUEST
                        ) {
                            requestCount++;
                        } else {
                            ideaSuggestionCount++;
                        }
                    },
                );
                if (dateRangeType === DateRangeTypes.MONTH) {
                    return {
                        month: supportRequest?._id?.month,
                        incidentCount,
                        requestCount,
                        ideaSuggestionCount,
                    };
                } else {
                    return {
                        day: supportRequest?._id?.day,
                        incidentCount,
                        requestCount,
                        ideaSuggestionCount,
                    };
                }
            });
            return {
                items: userTimes,
            };
        } catch (error) {
            this.logger.error(
                'Error in getSupportRequestCategoryList service',
                error,
            );
            throw error;
        }
    }

    generateProjectCategoryListBuilder({ dateRanges }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (dateRanges?.length) {
            conditions.push({
                createdAt: {
                    $gte: new Date(dateRanges[0]),
                },
            });
            conditions.push({
                createdAt: {
                    $lte: new Date(dateRanges[1]),
                },
            });
        }

        return conditions;
    }

    async getProjectCategoryList() {
        try {
            const supportRequests = await this.projectModel.aggregate([
                {
                    $match: {
                        $and: [softDeleteCondition] as unknown as Expression[],
                    },
                },
                {
                    $group: {
                        _id: { category: '$category' },
                        categoryCount: {
                            $sum: 1,
                        },
                    },
                },
            ]);

            return {
                items: supportRequests.map((supportRequest) => {
                    return {
                        category: supportRequest._id.category,
                        categoryCount: supportRequest.categoryCount,
                    };
                }),
            };
        } catch (error) {
            this.logger.error('Error in getProjectCategoryList service', error);
            throw error;
        }
    }

    async getUserStatusList(query: IUserStatusListQuery) {
        try {
            const { module = '', projectId = '', company = '' } = query;
            const userStatusList = await this.userModel.aggregate([
                {
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'constellationGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'constellationGroups',
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserStatusListBuilder({
                                module,
                                projectId,
                                company,
                            }),
                        ],
                    },
                },
                {
                    $group: {
                        _id: { status: '$status' },
                        statusCount: {
                            $sum: 1,
                        },
                    },
                },
            ]);

            return {
                items: userStatusList.map((userStatus) => {
                    return {
                        status: userStatus._id.status,
                        statusCount: userStatus.statusCount,
                    };
                }),
            };
        } catch (error) {
            this.logger.error('Error in getProjectCategoryList service', error);
            throw error;
        }
    }

    generateUserStatusListBuilder({ module, projectId, company }) {
        const conditions = [];
        conditions.push({
            $or: [
                {
                    deletedAt: {
                        $exists: true,
                        $eq: null,
                    },
                },
                {
                    deletedAt: {
                        $exists: false,
                    },
                },
                {
                    status: UserStatus.REJECTED,
                },
            ],
        });

        if (module?.length) {
            conditions.push({
                'accessModules.module': module,
            });
        }

        if (projectId?.length) {
            conditions.push({
                $or: [
                    { assignedProjectIds: new ObjectId(projectId) },
                    { adminProjectIds: new ObjectId(projectId) },
                    {
                        'constellationGroups.projectIds': new ObjectId(
                            projectId,
                        ),
                    },
                ],
            });
        }

        if (company?.length) {
            conditions.push({
                company,
            });
        }

        return conditions;
    }

    async getUserInCompanyList(query: IUserInCompanyListQuery) {
        try {
            const {
                dateRanges = [],
                projectId = '',
                dateRangeType = '',
            } = query;

            let groupCondition;
            let groupConditionDateType;

            if (dateRangeType === DateRangeTypes.MONTH) {
                groupCondition = { month: { $month: '$createdAt' } };
                groupConditionDateType = { month: `$_id.${dateRangeType}` };
            } else if (dateRangeType === DateRangeTypes.WEEK) {
                groupCondition = { week: { $week: '$createdAt' } };
                groupConditionDateType = { week: `$_id.${dateRangeType}` };
            } else if (dateRangeType === DateRangeTypes.YEAR) {
                groupCondition = { year: { $year: '$createdAt' } };
                groupConditionDateType = { year: `$_id.${dateRangeType}` };
            }

            const userInCompanyList = await this.userModel.aggregate([
                {
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'constellationGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'constellationGroups',
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserInCompanyListBuilder({
                                dateRanges,
                                projectId,
                            }),
                        ],
                    },
                },
                {
                    $group: {
                        _id: { ...groupCondition, company: '$company' },
                        userCount: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $group: {
                        _id: groupConditionDateType,
                        companies: {
                            $push: {
                                companyName: '$_id.company',
                                userCount: '$userCount',
                            },
                        },
                    },
                },
            ]);

            return {
                items: userInCompanyList.map((userInCompany) => {
                    return {
                        [dateRangeType]: userInCompany._id[dateRangeType],
                        companies: userInCompany.companies,
                    };
                }),
            };
        } catch (error) {
            this.logger.error('Error in getProjectCategoryList service', error);
            throw error;
        }
    }

    generateUserInCompanyListBuilder({ dateRanges, projectId }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });

        conditions.push({
            $and: [
                {
                    company: {
                        $exists: true,
                        $ne: null,
                    },
                },
                {
                    company: {
                        $exists: true,
                        $ne: '',
                    },
                },
            ],
        });

        if (projectId?.length) {
            conditions.push({
                $or: [
                    { assignedProjectIds: new ObjectId(projectId) },
                    {
                        'constellationGroups.projectIds': new ObjectId(
                            projectId,
                        ),
                    },
                ],
            });
        }

        if (dateRanges?.length) {
            conditions.push({
                createdAt: {
                    $gte: new Date(dateRanges[0]),
                },
            });
            conditions.push({
                createdAt: {
                    $lte: new Date(dateRanges[1]),
                },
            });
        }

        return conditions;
    }
}
