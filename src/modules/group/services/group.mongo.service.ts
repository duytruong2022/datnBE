import {
    Viewer3dProfile,
    Viewer3dProfileDocument,
} from 'src/modules/3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    AccessModules,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    INTEGER_POSITIVE_MIN_VALUE,
    UserStatus,
} from './../../../common/constants';
import {
    SecurityProfile,
    SecurityProfileDocument,
} from './../../security-profile/mongo-schemas/security-profile.schema';
import {
    IBulkCreateGroup,
    IGroupUpdateBody,
    IGroupUpdateProfileBody,
} from './../group.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MODULE_NAME } from '../group.constant';
import {
    DEFAULT_LIMIT_FOR_PAGINATION,
    HttpStatus,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { IGroupCreateBody, IGroupListQuery } from '../group.interface';
import { Group, GroupDocument } from '../mongo-schemas/group.schema';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import { ObjectId } from 'mongodb';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { IUserListQuery } from 'src/modules/user/user.interface';
import { IGetProjectQueryString } from 'src/modules/project/project.interface';
import {
    Project,
    ProjectDocument,
} from 'src/modules/project/mongo-schemas/project.schema';
const groupAttributes = [
    '_id',
    'name',
    'securityProfileId',
    'projectIds',
    'viewer3dProfileId',
    'description',
    'accessModule',
];
@Injectable()
export class GroupMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(SecurityProfile.name)
        private readonly securityProfileModel: Model<SecurityProfileDocument>,
        @InjectModel(Viewer3dProfile.name)
        private readonly viewer3dProfileModel: Model<Viewer3dProfileDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        private readonly i18n: I18nRequestScopeService,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async createGroup(group: IGroupCreateBody): Promise<GroupDocument> {
        try {
            const record = new this.groupModel({
                ...group,
            });
            await record.save();
            return await this.getGroupDetail(record._id);
        } catch (error) {
            this.logger.error('Error in createGroup service', error);
            throw error;
        }
    }

    async getGroupDetail(_id: ObjectId): Promise<GroupDocument> {
        try {
            return await this.groupModel
                .findOne({ _id, ...softDeleteCondition })
                .select([...groupAttributes]);
        } catch (error) {
            this.logger.error('Error in getGroupDetail service', error);
            throw error;
        }
    }

    async getGroupList(query: IGroupListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
                accessModule = '',
                profileIds = [],
            } = query;

            const mongooseQuery = {
                ...softDeleteCondition,
            };
            if (keyword) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    name: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                });
            }
            if (accessModule) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    accessModule,
                });
            }

            if (accessModule && profileIds?.length) {
                if (accessModule === AccessModules.SPACIALYTIC_CONSTELLATION) {
                    Object.assign(mongooseQuery, {
                        ...mongooseQuery,
                        securityProfileId: {
                            $in: profileIds.map(
                                (profileId) => new ObjectId(profileId),
                            ),
                        },
                    });
                } else if (
                    accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER
                ) {
                    Object.assign(mongooseQuery, {
                        ...mongooseQuery,
                        viewer3dProfileId: {
                            $in: profileIds.map(
                                (profileId) => new ObjectId(profileId),
                            ),
                        },
                    });
                }
            }

            const [resultList, count] = await Promise.all([
                this.groupModel
                    .find({
                        ...mongooseQuery,
                    })
                    .populate('projects')
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? 1
                                : -1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .select([...groupAttributes])
                    .lean(),
                this.groupModel.countDocuments({
                    ...mongooseQuery,
                }),
            ]);

            const groupIds = resultList.map((projectGroup) => projectGroup._id);
            let userList;

            if (accessModule === AccessModules.SPACIALYTIC_CONSTELLATION) {
                userList = await this.userModel.find({
                    ...softDeleteCondition,
                    'accessModules.module': accessModule,
                    constellationGroupIds: {
                        $in: groupIds,
                    },
                });
            } else {
                userList = await this.userModel.find({
                    ...softDeleteCondition,
                    'accessModules.module': accessModule,
                    viewer3dGroupIds: {
                        $in: groupIds,
                    },
                });
            }

            return {
                items: resultList.map((projectGroup) => {
                    let assignedUserCount = 0;
                    userList.forEach((user) => {
                        if (
                            (accessModule ===
                                AccessModules.SPACIALYTIC_CONSTELLATION &&
                                user.constellationGroupIds.some(
                                    (groupId) =>
                                        groupId.toString() ===
                                        projectGroup._id.toString(),
                                )) ||
                            (accessModule ===
                                AccessModules.SPACIALYTIC_3DWEBVIEWER &&
                                user.viewer3dGroupIds.some(
                                    (groupId) =>
                                        groupId.toString() ===
                                        projectGroup._id.toString(),
                                ))
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
            this.logger.error('Error in getGroupList service', error);
            throw error;
        }
    }

    async updateGroup(_id: ObjectId, group: IGroupUpdateBody) {
        try {
            await this.groupModel.updateOne(
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
            return await this.getGroupDetail(_id);
        } catch (error) {
            this.logger.error('Error in updateGroup service', error);
            throw error;
        }
    }

    async updateProfileGroup(_id: ObjectId, group: IGroupUpdateProfileBody) {
        try {
            await this.groupModel.updateOne(
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
            return await this.getGroupDetail(_id);
        } catch (error) {
            this.logger.error('Error in updateGroup service', error);
            throw error;
        }
    }

    async deleteGroup(_id: ObjectId, data: IGroupUpdateBody): Promise<void> {
        try {
            await this.groupModel.updateOne(
                { _id, ...softDeleteCondition },
                { ...data },
            );
        } catch (error) {
            this.logger.error('Error in deleteGroup service', error);
            throw error;
        }
    }

    async checkMemberGroupExist(
        groupId: ObjectId,
        accessModule: AccessModules,
    ): Promise<User> {
        try {
            const mongooseQuery = {
                ...softDeleteCondition,
            };

            if (accessModule === AccessModules.SPACIALYTIC_CONSTELLATION) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    constellationGroupIds: { $in: [groupId] },
                });
            } else if (accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    viewer3dGroupIds: { $in: [groupId] },
                });
            }
            const user = await this.userModel.findOne({
                ...mongooseQuery,
            });

            return user;
        } catch (error) {
            this.logger.error('Error in checkMemberGroupExist service', error);
            throw error;
        }
    }

    async checkGroupNameExists(
        name: string,
        accessModule: AccessModules,
        _id?: ObjectId,
    ) {
        try {
            const condition = {
                name: {
                    $regex: `^${name}$`,
                    $options: 'i',
                },
                accessModule,
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

            const count = await this.groupModel.count({
                ...condition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error('Error in checkGroupNameExist service', error);
            throw error;
        }
    }

    async getSecurityProfileById(securityProfileId: ObjectId) {
        try {
            const securityProfile = await this.securityProfileModel.findOne({
                securityProfileId,
                ...softDeleteCondition,
            });
            return securityProfile;
        } catch (error) {
            this.logger.error('Error in getSecurityProfileById service', error);
            throw error;
        }
    }

    async checkViewer3dProfileExist(viewer3dProfileId: ObjectId) {
        try {
            const viewer3dProfile = await this.viewer3dProfileModel.findOne({
                viewer3dProfileId,
                ...softDeleteCondition,
            });
            return viewer3dProfile;
        } catch (error) {
            this.logger.error(
                'Error in checkViewer3dProfileExist service',
                error,
            );
            throw error;
        }
    }

    async getGroupName(names: string[], accessModule: AccessModules) {
        try {
            const groups = await this.groupModel
                .find({
                    ...softDeleteCondition,
                    name: {
                        $in: names.map((name) => new RegExp(name, 'i')),
                    },
                    accessModule,
                })
                .select('name');
            return groups.map((group) => group.name);
        } catch (error) {
            this.logger.error('Error in get group name service', error);
            throw error;
        }
    }

    async getSecurityProfiles(securityProfiles: string[]) {
        try {
            const securityProfileList = await this.securityProfileModel
                .find({
                    ...softDeleteCondition,
                    name: { $in: securityProfiles },
                })
                .select('name');
            return securityProfileList;
        } catch (error) {
            this.logger.error('Error in getSecurityProfiles service', error);
            throw error;
        }
    }

    async getViewer3dProfiles(viewer3dProfiles: string[]) {
        try {
            const viewer3dProfileList = await this.viewer3dProfileModel
                .find({
                    ...softDeleteCondition,
                    name: { $in: viewer3dProfiles },
                })
                .select('name');
            return viewer3dProfileList;
        } catch (error) {
            this.logger.error('Error in getViewer3dProfiles service', error);
            throw error;
        }
    }

    async validateImportGroup(
        importGroup: IBulkCreateGroup,
        names: string[],
        securityProfiles?: SecurityProfile[],
        viewer3dProfiles?: Viewer3dProfile[],
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
                    'group.message.error.nameExisted',
                );
                validationResult.errors.push({
                    column: 'name',
                    errorMessage,
                    errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                });
                validationResult.isValid = false;
            }

            if (importGroup.securityProfile) {
                if (
                    !securityProfiles
                        .map((securityProfile) => securityProfile.name)
                        .includes(importGroup.securityProfile)
                ) {
                    const errorMessage = await this.i18n.translate(
                        'group.message.error.securityProfileNotExist',
                    );
                    validationResult.errors.push({
                        column: 'securityProfile',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            if (importGroup.viewer3dProfile) {
                if (
                    !viewer3dProfiles
                        .map((viewer3dProfile) => viewer3dProfile.name)
                        .includes(importGroup.viewer3dProfile)
                ) {
                    const errorMessage = await this.i18n.translate(
                        'group.message.error.viewer3dProfileNotExist',
                    );
                    validationResult.errors.push({
                        column: 'viewer3dProfile',
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

    mapImportGroup(
        importGroup: IBulkCreateGroup,
        createdBy: ObjectId,
        accessModule: AccessModules,
        securityProfiles?: SecurityProfileDocument[],
        viewer3dProfiles?: Viewer3dProfileDocument[],
    ) {
        try {
            const securityProfile = securityProfiles.find(
                (securityProfile) =>
                    securityProfile.name === importGroup.securityProfile,
            );

            const viewer3dProfile = viewer3dProfiles.find(
                (viewer3dProfile) =>
                    viewer3dProfile.name === importGroup.viewer3dProfile,
            );

            if (
                securityProfile &&
                accessModule === AccessModules.SPACIALYTIC_CONSTELLATION
            ) {
                importGroup.securityProfileId = securityProfile._id;
            } else if (
                viewer3dProfile &&
                accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER
            ) {
                importGroup.viewer3dProfileId = viewer3dProfile._id;
            }

            importGroup.accessModule = accessModule;

            return {
                ...importGroup,
                createdBy,
            };
        } catch (error) {
            this.logger.error('Error in mapImportGroup service', error);
            throw error;
        }
    }

    async bulkCreateGroups(importGroups: IBulkCreateGroup[]) {
        try {
            await this.groupModel.insertMany(importGroups);
        } catch (error) {
            this.logger.error('Error in bulkCreateGroups service', error);
            throw error;
        }
    }

    async getAllUsersInGroup(_id: ObjectId, accessModule: AccessModules) {
        try {
            const mongooseQuery = {
                ...softDeleteCondition,
                status: {
                    $ne: UserStatus.REJECTED,
                },
            };

            if (accessModule === AccessModules.SPACIALYTIC_CONSTELLATION) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    constellationGroupIds: {
                        $all: [_id],
                    },
                });
            } else if (accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    viewer3dGroupIds: {
                        $all: [_id],
                    },
                });
            }

            const resultList = await this.userModel
                .find({
                    ...mongooseQuery,
                })
                .sort({
                    [DEFAULT_ORDER_BY]: DEFAULT_ORDER_DIRECTION,
                })
                .select(['email', 'projects']);

            return {
                items: resultList,
            };
        } catch (error) {
            this.logger.error('Error in getAllUsersInGroup service', error);
            throw error;
        }
    }

    async getUserListNotInGroup(
        _id: ObjectId,
        accessModule: AccessModules,
        query: IUserListQuery,
    ) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
            } = query;
            const mongooseQuery = {
                ...softDeleteCondition,
                status: {
                    $ne: UserStatus.REJECTED,
                },
                'accessModules.module': accessModule,
            };
            if (keyword) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    email: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                });
            }

            if (accessModule === AccessModules.SPACIALYTIC_CONSTELLATION) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    constellationGroupIds: {
                        $nin: _id,
                    },
                });
            } else if (accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    viewer3dGroupIds: {
                        $nin: _id,
                    },
                });
            }

            const [resultList, count] = await Promise.all([
                this.userModel
                    .find({
                        ...mongooseQuery,
                    })
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? 1
                                : -1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .select(['email']),
                this.userModel.countDocuments({
                    ...mongooseQuery,
                }),
            ]);
            return {
                items: resultList,
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getUserListNotInGroup service', error);
            throw error;
        }
    }

    async getProjectListNotInGroup(
        ids: ObjectId[],
        query: IGetProjectQueryString,
    ) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
            } = query;
            const mongooseQuery = {
                ...softDeleteCondition,
            };
            if (keyword) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    $or: [
                        {
                            name: {
                                $regex: `.*${keyword}.*`,
                                $options: 'i',
                            },
                        },
                    ],
                });
            }
            Object.assign(mongooseQuery, {
                ...mongooseQuery,
                _id: {
                    $nin: ids,
                },
            });

            const [resultList, count] = await Promise.all([
                this.projectModel
                    .find({
                        ...mongooseQuery,
                    })
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? 1
                                : -1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .select(['name']),
                this.projectModel.countDocuments({
                    ...mongooseQuery,
                }),
            ]);
            return {
                items: resultList,
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getUserListNotInGroup service', error);
            throw error;
        }
    }

    async check3DViewerProfileInUsed(viewer3dProfileId: ObjectId) {
        try {
            const count = await this.groupModel.countDocuments({
                ...softDeleteCondition,
                viewer3dProfileId,
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    async deleteProjectFromGroup(projectId: ObjectId) {
        try {
            await this.groupModel.updateMany(
                {},
                {
                    $pull: {
                        projectIds: projectId,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }
}
