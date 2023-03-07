import {
    IBulkCreateProjectGroup,
    IProjectGroupUpdateBody,
    IUserNotInProjectGroupBody,
} from '../project-group.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { MODULE_NAME } from '../project-group.constant';
import {
    AccessModules,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    HttpStatus,
    INTEGER_POSITIVE_MIN_VALUE,
    MongoCollection,
    OrderBy,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import {
    getMongoKeywordConditions,
    getTotalSkipItem,
} from 'src/common/helpers/commonFunctions';
import {
    IProjectGroupCreateBody,
    IProjectGroupListQuery,
} from '../project-group.interface';
import {
    ProjectGroup,
    ProjectGroupDocument,
} from '../mongo-schemas/project-group.schema';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import { ObjectId } from 'mongodb';
import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    Project,
    ProjectDocument,
} from 'src/modules/project/mongo-schemas/project.schema';
import {
    ProjectProfile,
    ProjectProfileDocument,
} from 'src/modules/project-profile/mongo-schemas/project-profile.schema';
const projectGroupAttributes = [
    '_id',
    'name',
    'projectId',
    'projectProfileId',
    'description',
];
@Injectable()
export class ProjectGroupMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectGroup.name)
        private readonly projectGroupModel: Model<ProjectGroupDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(ProjectProfile.name)
        private readonly projectProfileModel: Model<ProjectProfileDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        private readonly i18n: I18nRequestScopeService,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async createProjectGroup(
        projectGroup: IProjectGroupCreateBody,
    ): Promise<ProjectGroupDocument> {
        try {
            const record = new this.projectGroupModel({
                ...projectGroup,
            });
            await record.save();
            return await this.getProjectGroupDetail(record._id);
        } catch (error) {
            this.logger.error('Error in createProjectGroup service', error);
            throw error;
        }
    }

    async getProjectGroupDetail(_id: ObjectId): Promise<ProjectGroupDocument> {
        try {
            return await this.projectGroupModel
                .findOne({ _id, ...softDeleteCondition })
                .select([...projectGroupAttributes])
                .lean();
        } catch (error) {
            this.logger.error('Error in getProjectGroupDetail service', error);
            throw error;
        }
    }

    async getProjectGroupList(query: IProjectGroupListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = OrderDirection.DESCENDING,
                orderBy = OrderBy.CREATED_AT,
                projectId,
                profileIds = [],
            } = query;
            const mongooseQuery = {
                ...softDeleteCondition,
                projectId,
                ...getMongoKeywordConditions(['name', 'description'], keyword),
            };

            if (profileIds?.length) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    projectProfileId: {
                        $in: profileIds.map(
                            (profileId) => new ObjectId(profileId),
                        ),
                    },
                });
            }

            const [resultList, count] = await Promise.all([
                this.projectGroupModel
                    .find({
                        ...mongooseQuery,
                    })
                    .populate('projectProfile')
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? 1
                                : -1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .lean(),
                this.projectGroupModel.countDocuments({
                    ...mongooseQuery,
                }),
            ]);

            const projectGroupIds = resultList.map(
                (projectGroup) => projectGroup._id,
            );

            const userList = await this.userModel.find({
                ...softDeleteCondition,
                'projects.projectGroupIds': {
                    $in: projectGroupIds,
                },
            });

            return {
                items: resultList.map((projectGroup) => {
                    let assignedUserCount = 0;
                    userList.forEach((user) => {
                        if (
                            user.projects.some((project) =>
                                project?.projectGroupIds?.some(
                                    (groupId) =>
                                        groupId.toString() ===
                                        projectGroup._id.toString(),
                                ),
                            )
                        ) {
                            assignedUserCount++;
                        }
                    });

                    return {
                        ...projectGroup,
                        assignedUserCount,
                    };
                }),
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getPrjectGroupList service', error);
            throw error;
        }
    }

    async updateProjectGroup(_id: ObjectId, group: IProjectGroupUpdateBody) {
        try {
            await this.projectGroupModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        ...group,
                        updatedAt: new Date(),
                    },
                },
            );
            return await this.getProjectGroupDetail(_id);
        } catch (error) {
            this.logger.error('Error in updateProjectGroup service', error);
            throw error;
        }
    }

    async deleteProjectGroup(
        _id: ObjectId,
        data: IProjectGroupUpdateBody,
    ): Promise<void> {
        try {
            await this.projectGroupModel.updateOne(
                { _id, ...softDeleteCondition },
                { ...data },
            );
        } catch (error) {
            this.logger.error('Error in deleteProjectGroup service', error);
            throw error;
        }
    }

    async checkProjectGroupNameExists(
        name: string,
        projectId: ObjectId,
        _id?: ObjectId,
    ) {
        try {
            const condition = {
                name: {
                    $regex: `^${name}$`,
                    $options: 'i',
                },
                projectId,
                ...softDeleteCondition,
            };
            if (_id) {
                Object.assign(condition, {
                    ...condition,
                    _id: {
                        $ne: _id,
                    },
                });
            }
            const count = await this.projectGroupModel.count({
                ...condition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkProjectGroupNameExists service',
                error,
            );
            throw error;
        }
    }

    async checkProjectExist(projectId: ObjectId) {
        try {
            const project = await this.projectModel.findOne({
                projectId,
                ...softDeleteCondition,
            });
            return project;
        } catch (error) {
            this.logger.error('Error in checkProjectExist service', error);
            throw error;
        }
    }

    generateGroupListQueryBuilder({ keyword, projectId }) {
        const conditions = [];
        conditions.push({ deletedAt: { $exists: true, $eq: null } });
        conditions.push({ projectId: projectId });

        if (keyword) {
            conditions.push(
                getMongoKeywordConditions(['name', 'description'], keyword),
            );
        }

        return conditions;
    }

    async getProjectGroupName(
        names: string[],
        accessModule: AccessModules,
        projectId: string,
    ) {
        try {
            const groups = await this.projectGroupModel
                .find({
                    ...softDeleteCondition,
                    name: {
                        $in: names.map((name) => new RegExp(name, 'i')),
                    },
                    accessModule,
                    projectId,
                })
                .select('name');
            return groups.map((group) => group.name);
        } catch (error) {
            this.logger.error('Error in getProjectGroupName service', error);
            throw error;
        }
    }

    async getProjectProfiles(securityProfiles: string[], projectId: string) {
        try {
            const projectProfileList = await this.projectProfileModel.find({
                ...softDeleteCondition,
                name: { $in: securityProfiles },
                projectId,
            });
            return projectProfileList;
        } catch (error) {
            this.logger.error('Error in getProjectProfiles service', error);
            throw error;
        }
    }

    async validateImportGroup(
        importGroup: IBulkCreateProjectGroup,
        names: string[],
        projectProfies?: ProjectProfile[],
    ) {
        try {
            const validationResult = {
                isValid: true,
                errors: [],
            };

            if (
                names
                    .map((name) => name.toLowerCase())
                    .includes(importGroup.name.toLowerCase())
            ) {
                const errorMessage = await this.i18n.translate(
                    'project-group.message.error.nameExisted',
                );
                validationResult.errors.push({
                    column: 'name',
                    errorMessage,
                    errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                });
                validationResult.isValid = false;
            }

            if (importGroup.projectProfile) {
                if (
                    !projectProfies
                        .map((projectProfile) => projectProfile.name)
                        .includes(importGroup.projectProfile)
                ) {
                    const errorMessage = await this.i18n.translate(
                        'project-group.message.error.projectProfileNotExist',
                    );
                    validationResult.errors.push({
                        column: 'projectProfile',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            return { validationResult, index: importGroup.index };
        } catch (error) {
            this.logger.error('Error in validateImportGroup service', error);
            throw error;
        }
    }

    async bulkCreateProjectGroups(importGroups: IBulkCreateProjectGroup[]) {
        try {
            await this.projectGroupModel.insertMany(importGroups);
        } catch (error) {
            this.logger.error(
                'Error in bulkCreateProjectGroups service',
                error,
            );
            throw error;
        }
    }

    mapImportProjectGroup(
        importGroup: IBulkCreateProjectGroup,
        createdBy: ObjectId,
        accessModule: AccessModules,
        projectId: string,
        projectProfiles?: ProjectProfileDocument[],
    ) {
        try {
            const projectProfile = projectProfiles.find(
                (securityProfile) =>
                    securityProfile.name === importGroup.projectProfile,
            );
            if (projectProfile) {
                importGroup.projectProfileId = projectProfile._id;
            }
            importGroup.accessModule = accessModule;

            return {
                ...importGroup,
                createdBy,
                projectId,
            };
        } catch (error) {
            this.logger.error('Error in mapImportProjectGroup service', error);
            throw error;
        }
    }

    async getProjectProfileById(projectProfileId: ObjectId) {
        try {
            const securityProfile = await this.projectProfileModel
                .findOne({
                    _id: projectProfileId,
                    ...softDeleteCondition,
                })
                .lean();
            return securityProfile;
        } catch (error) {
            this.logger.error('Error in getProjectProfileById service', error);
            throw error;
        }
    }

    async getAllUsersInProjectGroup(_id: ObjectId) {
        try {
            const resultList = await this.userModel
                .find({
                    ...softDeleteCondition,
                    'projects.projectGroupIds': {
                        $all: [_id],
                    },
                })
                .sort({
                    [DEFAULT_ORDER_BY]: DEFAULT_ORDER_DIRECTION,
                })
                .select(['email', 'firstName', 'lastName']);
            return {
                items: resultList,
            };
        } catch (error) {
            this.logger.error(
                'Error in getAllUsersInProjectGroup service',
                error,
            );
            throw error;
        }
    }

    async getAllUsersNotInProjectGroup(
        _id: ObjectId,
        query: IUserNotInProjectGroupBody,
    ) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
                accessModule,
                projectId,
            } = query;

            const mongooseQuery = [
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
                            ...this.generateUserListQueryBuilder({
                                _id,
                                keyword,
                                accessModule,
                                projectId,
                            }),
                        ],
                    },
                },
            ];
            const [resultList, totalUsers] = await Promise.all([
                this.userModel.aggregate([
                    ...mongooseQuery,
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.ASCENDING
                                    ? 1
                                    : -1,
                        },
                    },
                    { $skip: getTotalSkipItem(page, limit) },
                    { $limit: +limit },
                    {
                        $project: {
                            _id: 1,
                            email: 1,
                        },
                    },
                ]),
                this.userModel.aggregate([
                    ...mongooseQuery,
                    { $group: { _id: null, totalUsers: { $sum: 1 } } },
                ]),
            ]);
            return {
                items: resultList,
                totalItems: totalUsers[0]?.totalUsers | 0,
            };
        } catch (error) {
            this.logger.error(
                'Error in getUserListNotInProjectGroup service',
                error,
            );
            throw error;
        }
    }

    generateUserListQueryBuilder({ _id, keyword, accessModule, projectId }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (keyword) {
            conditions.push({
                email: {
                    $regex: `.*${keyword}.*`,
                    $options: 'i',
                },
            });
        }

        conditions.push({
            'accessModules.module': accessModule,
        });

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

        conditions.push({
            'projects.projectGroupIds': {
                $nin: [_id],
            },
        });
        return conditions;
    }

    async checkProjectProfileInUsed(projectProfileId: ObjectId) {
        try {
            const count = await this.projectGroupModel.countDocuments({
                ...softDeleteCondition,
                projectProfileId,
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    async checkMemberProjectGroupExist(_id: ObjectId) {
        try {
            return await this.userModel.findOne({
                ...softDeleteCondition,
                'projects.projectGroupIds': {
                    $all: [_id],
                },
            });
        } catch (error) {
            this.logger.error('Error in checkMemberGroupExist service', error);
        }
    }
}
