import { SecurityPermissions } from './../../security-profile/security-profile.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Expression, Model } from 'mongoose';
import { User, UserDocument } from '../mongo-schemas/user.schema';
import { MODULE_NAME } from '../user.constant';
import {
    AccessModules,
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    INTEGER_POSITIVE_MIN_VALUE,
    MongoCollection,
    OrderBy,
    OrderDirection,
    softDeleteCondition,
    UserRoles,
    UserStatus,
} from 'src/common/constants';
import {
    getAccessModules,
    getTotalSkipItem,
    hasSecurityPermissions,
} from 'src/common/helpers/commonFunctions';
import {
    IGetUnassignedToProjectUser,
    IProjectUser,
    IUserAccessModule,
    IUserCreateBody,
    IUserListQuery,
    IUserToken,
    IUserUpdateBody,
    IUserUpdateGroupIdsBody,
    IUserUpdateProjectGroupIdsBody,
} from '../user.interface';
import { ObjectId } from 'mongodb';
import {
    Country,
    CountryDocument,
} from 'src/common/mongo-schemas/country.schema';
import {
    Group,
    GroupDocument,
} from 'src/modules/group/mongo-schemas/group.schema';
import {
    SecurityProfile,
    SecurityProfileDocument,
} from 'src/modules/security-profile/mongo-schemas/security-profile.schema';
import { UpdateGroupAction } from 'src/modules/group/group.constant';
import uniq from 'lodash/uniq';
import difference from 'lodash/difference';
import uniqBy from 'lodash/uniqBy';
import intersection from 'lodash/intersection';
import {
    UserToken,
    UserTokenDocument,
} from 'src/modules/auth/mongo-schemas/user-token.schema.dto';
import {
    Viewer3dProfile,
    Viewer3dProfileDocument,
} from 'src/modules/3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import { ProjectPermissions } from 'src/modules/3D-viewer-profile/viewer-3d-profile.constant';
import {
    ProjectProfile,
    ProjectProfileDocument,
} from 'src/modules/project-profile/mongo-schemas/project-profile.schema';
import {
    Project,
    ProjectDocument,
} from 'src/modules/project/mongo-schemas/project.schema';
import {
    ProjectGroup,
    ProjectGroupDocument,
} from 'src/modules/project-group/mongo-schemas/project-group.schema';
import { UpdateProjectGroupAction } from 'src/modules/project-group/project-group.constant';
const userAttributes = ['firstName', 'lastName', 'email'];

@Injectable()
export class UserMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(Country.name)
        private readonly countryModel: Model<CountryDocument>,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
        @InjectModel(Viewer3dProfile.name)
        private readonly viewer3dProfileModule: Model<Viewer3dProfileDocument>,
        @InjectModel(ProjectProfile.name)
        private readonly projectProfileModel: Model<ProjectProfileDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(UserToken.name)
        private readonly userTokenModel: Model<UserTokenDocument>,
        @InjectModel(SecurityProfile.name)
        private readonly securityProfileModel: Model<SecurityProfileDocument>,
        @InjectModel(Viewer3dProfile.name)
        private readonly viewer3dProfileModel: Model<Viewer3dProfileDocument>,
        @InjectModel(ProjectGroup.name)
        private readonly projectGroupModel: Model<ProjectGroupDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getUserList(query: IUserListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = OrderDirection.DESCENDING,
                orderBy = OrderBy.CREATED_AT,
                status = [],
                accessModules = [],
                projectId = '',
                companies = [],
                countryIds = [],
                registrationFrom = [],
                constellationGroupIds = [],
                constellationProfileIds = [],
                viewer3dGroupIds = [],
                viewer3dProfileIds = [],
                projectGroupIds = [],
                projectProfileIds = [],
            } = query;

            const userList = await this.userModel.aggregate([
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
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'viewer3dGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'viewer3dGroups',
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_GROUPS,
                        localField: 'projects.projectGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'projectGroups',
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.SECURITY_PROFILES,
                        localField: 'securityProfileIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'securityProfiles',
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection['3D_VIEWER_PROFILES'],
                        localField: 'viewer3dProfileIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'viewer3dProfiles',
                    },
                },
                {
                    $lookup: {
                        from: 'countries',
                        localField: 'countryId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'country',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'approvedBy',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'approved',
                    },
                },
                {
                    $project: {
                        password: -1,
                        email: 1,
                        firstName: 1,
                        lastName: 1,
                        ldapUsername: 1,
                        accessModules: 1,
                        registrationFrom: 1,
                        approvedAt: 1,
                        status: 1,
                        countryId: 1,
                        country: 1,
                        constellationGroupIds: 1,
                        constellationGroups: 1,
                        securityProfileIds: 1,
                        securityProfiles: 1,
                        viewer3dGroupIds: 1,
                        viewer3dGroups: 1,
                        viewer3dProfiles: 1,
                        viewer3dProfileIds: 1,
                        approvedBy: 1,
                        approved: 1,
                        deletedAt: 1,
                        createdAt: 1,
                        projects: 1,
                        assignedProjectIds: 1,
                        adminProjectIds: 1,
                        company: 1,
                        lastLoginAt: 1,
                        fName: {
                            $ifNull: ['$firstName', ''],
                        },
                        lName: {
                            $ifNull: ['$lastName', ''],
                        },
                    },
                },
                {
                    $addFields: {
                        fullName: { $concat: ['$fName', ' ', '$lName'] },
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserListQueryBuilder({
                                keyword,
                                status,
                                accessModules,
                                projectId,
                                companies,
                                countryIds,
                                registrationFrom,
                                constellationGroupIds,
                                constellationProfileIds,
                                viewer3dGroupIds,
                                viewer3dProfileIds,
                                projectGroupIds,
                                projectProfileIds,
                            }),
                        ],
                    },
                },
                {
                    $sort: {
                        [orderBy]:
                            orderDirection === OrderDirection.DESCENDING
                                ? -1
                                : 1,
                    },
                },
                { $skip: getTotalSkipItem(page, limit) },
                { $limit: +limit },
            ]);

            const totalUsers = await this.userModel.aggregate([
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
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'viewer3dGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'viewer3dGroups',
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_GROUPS,
                        localField: 'projects.projectGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'projectGroups',
                    },
                },
                {
                    $addFields: {
                        fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                    },
                },
                {
                    $match: {
                        $and: this.generateUserListQueryBuilder({
                            keyword,
                            status,
                            accessModules,
                            projectId,
                            companies,
                            countryIds,
                            registrationFrom,
                            constellationGroupIds,
                            constellationProfileIds,
                            viewer3dGroupIds,
                            viewer3dProfileIds,
                            projectGroupIds,
                            projectProfileIds,
                        }),
                    },
                },
                { $group: { _id: null, totalUsers: { $sum: 1 } } },
            ]);

            let projectProfiles: ProjectProfileDocument[] = [];
            let projectGroups: ProjectGroupDocument[] = [];
            let assignedConstellationGroups: GroupDocument[] = [];

            if (projectId) {
                let projectProfileIds: ObjectId[] = [];
                let projectGroupIds: ObjectId[] = [];
                userList.forEach((user) => {
                    const project = user.projects?.find(
                        (project) =>
                            project.projectId.toString() ===
                            projectId.toString(),
                    );
                    projectProfileIds = projectProfileIds?.concat(
                        project?.projectProfileIds,
                    );

                    projectGroupIds = projectGroupIds?.concat(
                        project?.projectGroupIds,
                    );
                });

                projectGroups = (await this.projectGroupModel
                    .find({
                        ...softDeleteCondition,
                        _id: { $in: uniq(projectGroupIds) },
                    })
                    .select(['name', 'projectProfileId'])
                    .lean()) as unknown as ProjectGroupDocument[];

                // add projectProfileId in project-group into projectProfileIds array
                projectGroups.forEach((group) => {
                    if (group?.projectProfileId) {
                        projectProfileIds.push(group.projectProfileId);
                    }
                });

                projectProfiles = (await this.projectProfileModel
                    .find({
                        ...softDeleteCondition,
                        _id: { $in: uniq(projectProfileIds) },
                    })
                    .select(['name'])
                    .lean()) as unknown as ProjectProfileDocument[];

                assignedConstellationGroups = (await this.groupModel
                    .find({
                        ...softDeleteCondition,
                        accessModule: AccessModules.SPACIALYTIC_CONSTELLATION,
                        projectIds: new ObjectId(projectId),
                    })
                    .select(['name', 'projectIds'])
                    .lean()) as unknown as GroupDocument[];
            }
            const groupList = (await this.groupModel
                .find({
                    ...softDeleteCondition,
                    accessModule: AccessModules.SPACIALYTIC_CONSTELLATION,
                })
                .select([
                    'name',
                    'projectIds',
                    'securityProfileId',
                    'viewer3dProfileId',
                ])
                .lean()) as unknown as GroupDocument[];

            const securityProfiles = (await this.securityProfileModel
                .find({
                    ...softDeleteCondition,
                })
                .select(['name'])
                .lean()) as unknown as SecurityProfileDocument[];
            const viewer3dProfiles = (await this.viewer3dProfileModel
                .find({
                    ...softDeleteCondition,
                })
                .select(['name'])
                .lean()) as unknown as Viewer3dProfileDocument[];

            const userListResponse = userList.map((user) => {
                const isAdminConstellation = user?.accessModules?.some(
                    (item) =>
                        item.module ===
                            AccessModules.SPACIALYTIC_CONSTELLATION &&
                        item.roles.includes(UserRoles.ADMIN),
                );
                user.isAdminConstellation = isAdminConstellation;
                const project = user.projects?.find(
                    (project) =>
                        project.projectId.toString() === projectId.toString(),
                );

                const groupUserIds =
                    user?.constellationGroupIds?.map((item) =>
                        item.toString(),
                    ) ?? [];
                let projectIds =
                    user.assignedProjectIds?.concat(user.adminProjectIds) ?? [];
                groupList.forEach((item) => {
                    if (groupUserIds.includes(item._id.toString())) {
                        projectIds = projectIds?.concat(item.projectIds);
                    }
                });
                const projectAssignedCount = uniq(projectIds).length;

                const projectGroupsResponse = projectGroups?.filter(
                    (projectGroup) =>
                        project?.projectGroupIds?.some(
                            (groupId) =>
                                groupId.toString() ===
                                projectGroup._id?.toString(),
                        ),
                );

                // add projectProfileId in project-group into projectProfileIds array in projects user
                let mergerProjectProfileIds = project?.projectProfileIds || [];
                projectGroupsResponse.forEach((group) => {
                    if (group?.projectProfileId) {
                        mergerProjectProfileIds.push(group.projectProfileId);
                    }
                });
                mergerProjectProfileIds = uniq(mergerProjectProfileIds);

                const projectProfilesResponse = projectProfiles?.filter(
                    (projectProfile) =>
                        mergerProjectProfileIds.some(
                            (projectProfileId) =>
                                projectProfileId.toString() ===
                                projectProfile._id?.toString(),
                        ),
                );

                // get All security profile of User
                const constellationProfileIds =
                    user?.constellationGroups?.map((item) =>
                        item?.securityProfileId?.toString(),
                    ) ?? [];

                const constellationProfileGroups = securityProfiles.filter(
                    (securityProfile) =>
                        constellationProfileIds.includes(
                            securityProfile._id.toString(),
                        ),
                );

                user.securityProfiles = uniqBy(
                    user.securityProfiles?.concat(
                        constellationProfileGroups,
                    ) as SecurityProfile[],
                    (item) => item._id.toString(),
                );

                // get All viewer3d profile of User
                const viewer3dProfileGroupIds =
                    user?.viewer3dGroups?.map((item) =>
                        item?.viewer3dProfileId?.toString(),
                    ) ?? [];

                const viewer3dProfileGroups = viewer3dProfiles.filter(
                    (viewer3dProfile) =>
                        viewer3dProfileGroupIds.includes(
                            viewer3dProfile._id.toString(),
                        ),
                );

                user.viewer3dProfiles = uniqBy(
                    user.viewer3dProfiles?.concat(
                        viewer3dProfileGroups,
                    ) as Viewer3dProfile[],
                    (item) => item._id.toString(),
                );

                const assignedConstellationGroupResponse =
                    assignedConstellationGroups.filter((constellationGroup) =>
                        user.constellationGroupIds.some(
                            (constellationGroupId) =>
                                constellationGroup?._id.toString() ===
                                constellationGroupId.toString(),
                        ),
                    );

                return {
                    ...user,
                    country: user.country[0],
                    approved: user.approved[0],
                    groups: user.groups,
                    securityProfiles: user.securityProfiles,
                    projectProfiles: projectProfilesResponse,
                    projectGroups: projectGroupsResponse,
                    projectAssignedCount: projectAssignedCount,
                    assignedConstellationGroup:
                        assignedConstellationGroupResponse,
                };
            });
            return {
                items: userListResponse,
                totalItems: totalUsers[0]?.totalUsers | 0,
            };
        } catch (error) {
            this.logger.error('Error in getUserList service', error);
            throw error;
        }
    }

    async getUserById(id: ObjectId, withPassword = false) {
        try {
            const projection = withPassword ? {} : { password: 0 };
            const user = await this.userModel.findOne(
                {
                    ...softDeleteCondition,
                    _id: id,
                },
                projection,
            );
            return user;
        } catch (error) {
            this.logger.error('Error in getUserDetails service', error);
            throw error;
        }
    }

    async getUserByEmails(emails: string[], withPassword = false) {
        try {
            const projection = withPassword ? {} : { password: 0 };
            return await this.userModel.find(
                {
                    ...softDeleteCondition,
                    email: {
                        $in: emails,
                    },
                },
                projection,
            );
        } catch (error) {
            this.logger.error('Error in getUserByEmails service', error);
            throw error;
        }
    }

    async createUser(createUserDto: IUserCreateBody): Promise<UserDocument> {
        try {
            const user = new this.userModel({
                ...createUserDto,
            });
            return await user.save();
        } catch (error) {
            this.logger.error('Error in createUser service', error);
            throw error;
        }
    }

    async updateUser(
        id: ObjectId,
        updateUser: IUserUpdateBody,
    ): Promise<UserDocument> {
        try {
            await this.userModel.updateOne(
                { _id: id, ...softDeleteCondition },
                updateUser,
            );
            const user = await this.getUserById(id);
            return user;
        } catch (error) {
            this.logger.error('Error in updateUser service', error);
            throw error;
        }
    }

    async updateConstellationGroupIdsUser(
        id: ObjectId,
        updateGroupIdsUser: IUserUpdateGroupIdsBody,
    ): Promise<UserDocument> {
        try {
            const user = await this.getUserById(id);
            const groupIds = user.constellationGroupIds || [];
            if (updateGroupIdsUser.action === UpdateGroupAction.ASSIGN_USER) {
                groupIds.push(updateGroupIdsUser.groupId);
            } else if (
                updateGroupIdsUser.action === UpdateGroupAction.REMOVE_USER
            ) {
                groupIds.splice(
                    groupIds.indexOf(updateGroupIdsUser.groupId),
                    1,
                );
            }

            await this.userModel.updateOne(
                { _id: id, ...softDeleteCondition },
                {
                    constellationGroupIds: groupIds,
                    updatedBy: updateGroupIdsUser.updatedBy,
                },
            );
            const updatedUser = await this.getUserById(id);
            return updatedUser;
        } catch (error) {
            this.logger.error(
                'Error in updateConstellationGroupIdsUser service',
                error,
            );
            throw error;
        }
    }

    async updateViewer3dGroupIdsUser(
        id: ObjectId,
        updateGroupIdsUser: IUserUpdateGroupIdsBody,
    ): Promise<UserDocument> {
        try {
            const user = await this.getUserById(id);
            const groupIds = user.viewer3dGroupIds || [];
            if (updateGroupIdsUser.action === UpdateGroupAction.ASSIGN_USER) {
                groupIds.push(updateGroupIdsUser.groupId);
            } else if (
                updateGroupIdsUser.action === UpdateGroupAction.REMOVE_USER
            ) {
                groupIds.splice(
                    groupIds.indexOf(updateGroupIdsUser.groupId),
                    1,
                );
            }

            await this.userModel.updateOne(
                { _id: id, ...softDeleteCondition },
                {
                    viewer3dGroupIds: groupIds,
                    updatedBy: updateGroupIdsUser.updatedBy,
                },
            );
            const updatedUser = await this.getUserById(id);
            return updatedUser;
        } catch (error) {
            this.logger.error(
                'Error in updateConstellationGroupIdsUser service',
                error,
            );
            throw error;
        }
    }

    async checkChangeSecurityProfile(
        userId: ObjectId,
        securityProfileId: ObjectId,
    ): Promise<boolean> {
        try {
            const user = await this.getUserById(userId);
            if (
                !user.securityProfileIds ||
                user.securityProfileIds?.includes(securityProfileId)
            ) {
                return true;
            } else {
                // get Permission list of group selected
                const groupPermissionObjects = await this.securityProfileModel
                    .find({
                        _id: securityProfileId,
                    })
                    .select('permissions');

                const groupPermissions = groupPermissionObjects.flatMap(
                    (item) => item.permissions,
                );

                const userPermissions =
                    await this.getFullConstellationSecurityPermissionsOfUser(
                        userId,
                    );

                return (
                    difference(groupPermissions, userPermissions)?.length > 0
                );
            }
        } catch (error) {
            this.logger.error(
                'Error in checkChangeSecurityProfile service',
                error,
            );
            throw error;
        }
    }

    async checkChangeViewer3dProfile(
        userId: ObjectId,
        viewer3dProfileId: ObjectId,
    ): Promise<boolean> {
        try {
            const user = await this.getUserById(userId);
            if (
                !user.viewer3dProfileIds ||
                user.viewer3dProfileIds?.includes(viewer3dProfileId)
            ) {
                return true;
            } else {
                // get Permission list of group selected
                const groupPermissionObjects = await this.viewer3dProfileModel
                    .find({
                        _id: viewer3dProfileId,
                    })
                    .select('permissions');

                const groupPermissions = groupPermissionObjects.flatMap(
                    (item) => item.permissions,
                );

                const userPermissions =
                    await this.getFullViewer3dPermissionsOfUser(userId);

                return (
                    difference(groupPermissions, userPermissions)?.length > 0
                );
            }
        } catch (error) {
            this.logger.error(
                'Error in checkChangeSecurityProfile service',
                error,
            );
            throw error;
        }
    }

    async checkChangeProjectProfile(
        userId: ObjectId,
        projectId: ObjectId,
        projectGroupId: ObjectId,
    ): Promise<boolean> {
        try {
            const user = await this.getUserById(userId);
            const project = user?.projects?.find((project) => {
                return project.projectId == projectId;
            });
            const projectGroup = await this.projectGroupModel
                .findOne({
                    ...softDeleteCondition,
                    _id: projectGroupId,
                })
                .select(['projectProfileId']);

            if (!projectGroup || !projectGroup.projectProfileId) {
                return false;
            }

            const isNotExistProjectProfile = project?.projectProfileIds?.find(
                (projectProfileId) => {
                    return (
                        projectProfileId.toString() ===
                        projectGroup.projectProfileId.toString()
                    );
                },
            );

            if (isNotExistProjectProfile) {
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(
                'Error in checkChangeProjectProfile service',
                error,
            );
            throw error;
        }
    }

    async updateProjectGroupIdsUser(
        _id: ObjectId,
        body: IUserUpdateProjectGroupIdsBody,
    ) {
        try {
            const user = await this.getUserById(_id);
            const projectsUser: IProjectUser[] = user?.projects || [];

            if (body.action === UpdateProjectGroupAction.ASSIGN_USER) {
                let projectUser = projectsUser.find((projectUser) => {
                    return projectUser.projectId == body.projectId;
                });

                if (!projectUser) {
                    projectUser = {
                        projectId: new ObjectId(body.projectId),
                        projectGroupIds: [new ObjectId(body.projectGroupId)],
                        projectProfileIds: [],
                    };
                    projectsUser.push(projectUser);
                } else {
                    projectUser.projectGroupIds =
                        projectUser.projectGroupIds || [];
                    projectUser.projectGroupIds.push(
                        new ObjectId(body.projectGroupId),
                    );
                }
            } else if (body.action === UpdateProjectGroupAction.REMOVE_USER) {
                const projectUser = projectsUser.find((projectUser) => {
                    return projectUser.projectId == body.projectId;
                });
                projectUser.projectGroupIds =
                    projectUser.projectGroupIds.filter((groupId) => {
                        return (
                            groupId.toString() !==
                            body.projectGroupId.toString()
                        );
                    });
            }
            await this.userModel.updateOne(
                { _id, ...softDeleteCondition },
                {
                    projects: projectsUser,
                    updatedBy: body.updatedBy,
                },
            );
            return await this.getUserById(_id);
        } catch (error) {
            this.logger.error(
                'Error in updateProjectGroupIdsUser service',
                error,
            );
            throw error;
        }
    }

    async deleteUser(id: ObjectId, deletedBy: ObjectId): Promise<void> {
        const session = await this.connection.startSession();
        try {
            await session.startTransaction();
            await this.userModel.updateOne(
                { _id: id, ...softDeleteCondition },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
            await this.userTokenModel.deleteMany({
                userId: id,
            });
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in deleteUser service', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async checkEmailExist(email: string): Promise<boolean> {
        try {
            const numberOfUser = await this.userModel.count({
                ...softDeleteCondition,
                email: {
                    $eq: email,
                },
            });
            return numberOfUser > 0;
        } catch (error) {
            this.logger.error('Error in checkEmailExist service', error);
            throw error;
        }
    }

    async getFullConstellationSecurityPermissionsOfUser(
        userId: ObjectId,
    ): Promise<SecurityPermissions[]> {
        try {
            const user = await this.getUserById(userId);

            // get Permission list of User
            // permission group
            const securityProfileGroups = await this.groupModel
                .find({
                    _id: {
                        $in: user.constellationGroupIds,
                    },
                })
                .select('securityProfileId');

            const securityProfileGroupIds = securityProfileGroups.map(
                (item) => item.securityProfileId,
            );
            // permission security profile
            const mergeSecurityProfile = uniq(
                securityProfileGroupIds.concat(
                    user.securityProfileIds as ObjectId[],
                ),
            );
            const securities = await this.securityProfileModel
                .find({
                    _id: {
                        $in: mergeSecurityProfile,
                    },
                })
                .select('permissions');

            return uniq(securities.flatMap((item) => item.permissions));
        } catch (error) {
            this.logger.error(
                'Error in getFullConstellationSecurityPermissionsOfUser service',
                error,
            );
            throw error;
        }
    }

    async getFullViewer3dPermissionsOfUser(
        userId: ObjectId,
    ): Promise<ProjectPermissions[]> {
        try {
            const user = await this.getUserById(userId);

            // get Permission list of User
            // permission group
            const viewer3dProfileGroups = await this.groupModel
                .find({
                    _id: {
                        $in: user.viewer3dGroupIds,
                    },
                })
                .select('viewer3dProfileId');

            const viewer3dProfileGroupIds = viewer3dProfileGroups.map(
                (item) => item.viewer3dProfileId,
            );
            // permission viewer3d profile
            const mergeViewer3dProfile = uniq(
                viewer3dProfileGroupIds.concat(
                    user.viewer3dProfileIds as ObjectId[],
                ),
            );
            const securities = await this.viewer3dProfileModel
                .find({
                    _id: {
                        $in: mergeViewer3dProfile,
                    },
                })
                .select('permissions');

            return uniq(securities.flatMap((item) => item.permissions));
        } catch (error) {
            this.logger.error(
                'Error in getFullViewer3dPermissionsOfUser service',
                error,
            );
            throw error;
        }
    }

    async getCountryById(countryId: ObjectId) {
        try {
            const country = await this.countryModel
                .findOne({
                    _id: countryId,
                    ...softDeleteCondition,
                })
                .lean();
            return country;
        } catch (error) {
            this.logger.error('Error in getCountryById service', error);
            throw error;
        }
    }

    async checkGroupExists(groupIds: ObjectId[], accessModules: AccessModules) {
        try {
            const groups = await this.groupModel
                .find({
                    ...softDeleteCondition,
                    _id: { $in: groupIds },
                    accessModule: { $in: accessModules },
                })
                .select('_id');
            return groups.length === groupIds.length;
        } catch (error) {
            this.logger.error('Error in checkGroupExist service', error);
            throw error;
        }
    }

    async checkProjectGroupExists(groupIds: ObjectId[]) {
        try {
            const groups = await this.projectGroupModel
                .find({
                    ...softDeleteCondition,
                    _id: { $in: groupIds },
                })
                .select('_id');
            return groups.length === groupIds.length;
        } catch (error) {
            this.logger.error('Error in checkGroupExist service', error);
            throw error;
        }
    }

    async checkSecurityProfileExists(securityProfileIds: ObjectId[]) {
        try {
            const securityProfiles = await this.securityProfileModel
                .find({
                    ...softDeleteCondition,
                    _id: { $in: securityProfileIds },
                })
                .select('_id');
            return securityProfiles.length === securityProfileIds.length;
        } catch (error) {
            this.logger.error(
                'Error in checkSecurityProfileExist service',
                error,
            );
            throw error;
        }
    }

    async checkViewer3dProfileIdsExists(viewer3dProfileIds: ObjectId[]) {
        try {
            const viewer3dProfiles = await this.viewer3dProfileModule
                .find({
                    ...softDeleteCondition,
                    _id: { $in: viewer3dProfileIds },
                })
                .select('_id');
            return viewer3dProfiles.length === viewer3dProfileIds.length;
        } catch (error) {
            this.logger.error(
                'Error in checkViewer3dProfileIdsExists service',
                error,
            );
            throw error;
        }
    }

    async checkProjectProfileIdsExists(projectProfileIds: ObjectId[]) {
        try {
            const projectProfiles = await this.projectProfileModel
                .find({
                    ...softDeleteCondition,
                    _id: { $in: projectProfileIds },
                })
                .select('_id');
            return projectProfiles.length === projectProfileIds.length;
        } catch (error) {
            this.logger.error(
                'Error in checkProjectProfileIdsExists service',
                error,
            );
            throw error;
        }
    }

    async checkProjectIdsExists(projectId: ObjectId) {
        try {
            const projects = await this.projectModel
                .findOne({
                    ...softDeleteCondition,
                    _id: projectId,
                })
                .select('_id');
            return projects;
        } catch (error) {
            this.logger.error(
                'Error in checkProjectProfileIdsExists service',
                error,
            );
            throw error;
        }
    }

    generateUserListQueryBuilder({
        keyword,
        status,
        accessModules,
        projectId,
        countryIds,
        companies,
        registrationFrom,
        constellationGroupIds,
        constellationProfileIds,
        viewer3dGroupIds,
        viewer3dProfileIds,
        projectGroupIds,
        projectProfileIds,
    }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (keyword) {
            conditions.push({
                $or: [
                    {
                        fullName: {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                    {
                        email: {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                    {
                        ldapUsername: {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                ],
            });
        }
        if (status?.length) {
            conditions.push({
                status: {
                    $in: status,
                },
            });
        }
        if (accessModules?.length) {
            conditions.push({
                'accessModules.module': {
                    $in: accessModules,
                },
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

        if (countryIds?.length) {
            conditions.push({
                countryId: {
                    $in: countryIds.map((countryId) => new ObjectId(countryId)),
                },
            });
        }

        if (companies?.length) {
            conditions.push({
                company: {
                    $in: companies,
                },
            });
        }

        if (registrationFrom?.length) {
            conditions.push({
                registrationFrom: {
                    $in: registrationFrom,
                },
            });
        }

        if (constellationGroupIds?.length) {
            conditions.push({
                constellationGroupIds: {
                    $in: constellationGroupIds.map(
                        (constellationGroupId) =>
                            new ObjectId(constellationGroupId),
                    ),
                },
            });
        }

        if (constellationProfileIds?.length) {
            conditions.push({
                $or: [
                    {
                        securityProfileIds: {
                            $in: constellationProfileIds.map(
                                (constellationProfileId) =>
                                    new ObjectId(constellationProfileId),
                            ),
                        },
                    },
                    {
                        'constellationGroups.securityProfileId': {
                            $in: constellationProfileIds.map(
                                (constellationProfileId) =>
                                    new ObjectId(constellationProfileId),
                            ),
                        },
                    },
                ],
            });
        }

        if (viewer3dGroupIds?.length) {
            conditions.push({
                viewer3dGroupIds: {
                    $in: viewer3dGroupIds.map(
                        (viewer3dGroupId) => new ObjectId(viewer3dGroupId),
                    ),
                },
            });
        }

        if (viewer3dProfileIds?.length) {
            conditions.push({
                $or: [
                    {
                        viewer3dProfileIds: {
                            $in: viewer3dProfileIds.map(
                                (viewer3dProfileId) =>
                                    new ObjectId(viewer3dProfileId),
                            ),
                        },
                    },
                    {
                        'viewer3dGroups.viewer3dProfileId': {
                            $in: viewer3dProfileIds.map(
                                (viewer3dProfileId) =>
                                    new ObjectId(viewer3dProfileId),
                            ),
                        },
                    },
                ],
            });
        }

        if (projectGroupIds?.length) {
            conditions.push({
                'projects.projectGroupIds': {
                    $in: projectGroupIds.map(
                        (projectGroupIds) => new ObjectId(projectGroupIds),
                    ),
                },
            });
        }

        if (projectProfileIds?.length) {
            conditions.push({
                $or: [
                    {
                        'projects.projectProfileIds': {
                            $in: projectProfileIds.map(
                                (projectProfileIds) =>
                                    new ObjectId(projectProfileIds),
                            ),
                        },
                    },
                    {
                        'projectGroups.projectProfileId': {
                            $in: projectProfileIds.map(
                                (projectProfileIds) =>
                                    new ObjectId(projectProfileIds),
                            ),
                        },
                    },
                ],
            });
        }

        return conditions;
    }

    async getUsersByModule(module: AccessModules, role: UserRoles) {
        try {
            const users = await this.userModel
                .find({
                    'accessModules.module': module,
                    'accessModules.roles': role,
                    ...softDeleteCondition,
                })
                .select(userAttributes)
                .lean();
            return users;
        } catch (error) {
            this.logger.error('Error in getUsersByModule service', error);
            throw error;
        }
    }

    hasPermissionToManage(
        adminAccessModules: IUserAccessModule[],
        userAccessModules: IUserAccessModule[],
    ) {
        const adminModules = getAccessModules(
            adminAccessModules,
            UserRoles.ADMIN,
        );
        const userModules = getAccessModules(
            userAccessModules,
            UserRoles.NORMAL_USER,
        ).concat(getAccessModules(userAccessModules, UserRoles.ADMIN));
        return intersection(adminModules, userModules).length > 0;
    }

    async deactivateUser(userId: ObjectId) {
        try {
            await this.userModel.updateOne(
                {
                    _id: userId,
                    ...softDeleteCondition,
                },
                {
                    status: UserStatus.ACTIVE,
                },
            );
        } catch (error) {
            this.logger.error('Error in deactivateUser service', error);
            throw error;
        }
    }

    async activeUser(userId: ObjectId, approvedBy: ObjectId) {
        try {
            await this.userModel.updateOne(
                {
                    _id: userId,
                    ...softDeleteCondition,
                },
                {
                    status: UserStatus.ACTIVE,
                    approvedAt: new Date(),
                    approvedBy,
                },
            );
        } catch (error) {
            this.logger.error('Error in activeUser service', error);
            throw error;
        }
    }

    async activeNewPassword(userId: ObjectId) {
        try {
            const user = await this.getUserById(userId);
            await this.userModel.updateOne(
                {
                    _id: userId,
                    ...softDeleteCondition,
                },
                {
                    password: user.newPasswordWaitingActice,
                    newPasswordWaitingActice: '',
                },
            );
        } catch (error) {
            this.logger.error('Error in activeNewPassword service', error);
            throw error;
        }
    }

    async createUserToken(userToken: IUserToken) {
        try {
            await this.userTokenModel.create(userToken);
        } catch (error) {
            this.logger.error('Error in createUserToken', error);
            throw error;
        }
    }

    async getUserByEmail(email: string) {
        try {
            const user = await this.userModel.findOne({
                ...softDeleteCondition,
                email: {
                    $eq: email,
                },
            });
            return user;
        } catch (error) {
            this.logger.error(
                'Error in getUserByEmailOrLdapUsername service',
                error,
            );
            throw error;
        }
    }

    async getFullPermissionsOfUser(
        userId: ObjectId,
        projectId: ObjectId,
        accessModule: AccessModules,
    ): Promise<ProjectPermissions[]> {
        try {
            const user = await this.getUserById(userId);
            const adminAccessModule = getAccessModules(
                user.accessModules,
                UserRoles.ADMIN,
            );
            if (adminAccessModule.includes(accessModule)) {
                return Object.values(ProjectPermissions);
            }

            // get total Permission list of User
            const projectUser = user?.projects?.find((item) => {
                return item.projectId.toString() === projectId.toString();
            });
            if (projectUser) {
                // permission of group
                const projectProfileGroups = await this.projectGroupModel
                    .find({
                        _id: {
                            $in: projectUser.projectGroupIds,
                        },
                    })
                    .select('projectProfileId');

                const projectProfileGroupIds = projectProfileGroups.map(
                    (item) => item.projectProfileId,
                );

                // merge permission of group with permission of user
                const mergeProjectProfileIds = uniq(
                    projectProfileGroupIds.concat(
                        projectUser.projectProfileIds as ObjectId[],
                    ),
                );

                const securities = await this.projectProfileModel
                    .find({
                        _id: {
                            $in: mergeProjectProfileIds,
                        },
                    })
                    .select('permissions');

                return uniq(securities.flatMap((item) => item.permissions));
            } else return [];
        } catch (error) {
            this.logger.error(
                'Error in getFullProjectPermissionsOfUser service',
                error,
            );
            throw error;
        }
    }

    async getProjectSecurityPermissionsOfUser(
        userId: ObjectId,
        projectId: ObjectId,
    ): Promise<ProjectPermissions[]> {
        try {
            const fullPermission = await this.getFullPermissionsOfUser(
                userId,
                projectId,
                AccessModules.SPACIALYTIC_CONSTELLATION,
            );

            return fullPermission;
        } catch (error) {
            this.logger.error(
                'Error in getProjectSecurityPermissionsOfUser service',
                error,
            );
            throw error;
        }
    }

    async getProject3dViewerPermissionsOfUser(
        userId: ObjectId,
        projectId: ObjectId,
    ): Promise<ProjectPermissions[]> {
        try {
            const fullPermission = await this.getFullPermissionsOfUser(
                userId,
                projectId,
                AccessModules.SPACIALYTIC_3DWEBVIEWER,
            );

            return fullPermission.filter((item) => {
                return item.startsWith('3D_WEBVIEWER');
            });
        } catch (error) {
            this.logger.error(
                'Error in getProject3dViewerPermissionsOfUser service',
                error,
            );
            throw error;
        }
    }
    /**
     * Get all project ids that user can access
     * @param user user data
     * @returns {array} null if user can access all project, otherwise accessible project ids
     */
    async getAllProjectIdsUserCanAccess(user: User) {
        try {
            const adminAccessModules = getAccessModules(
                user.accessModules,
                UserRoles.ADMIN,
            );
            if (
                adminAccessModules.includes(
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                )
            ) {
                return null;
            }
            const accessModule = getAccessModules(
                user.accessModules,
                UserRoles.NORMAL_USER,
            );
            if (
                !accessModule.includes(AccessModules.SPACIALYTIC_CONSTELLATION)
            ) {
                return [];
            }
            // Get Project Assigned User
            const projectAssignedUserIds =
                user.assignedProjectIds.concat(user.adminProjectIds) || [];

            // Get Project Assigned Group of User
            const groupAssignedUserIds = user.constellationGroupIds || [];
            const [groupAssignedUsers, adminProjects] = await Promise.all([
                this.groupModel
                    .find({
                        ...softDeleteCondition,
                        _id: {
                            $in: groupAssignedUserIds,
                        },
                    })
                    .select(['name', 'projectIds']),
                this.projectModel
                    .find({
                        ...softDeleteCondition,
                        adminId: user._id,
                    })
                    .select(['_id']),
            ]);

            const adminProjectIds = adminProjects.map((project) => project._id);

            const projectAssignedGroupIds =
                groupAssignedUsers?.flatMap((item) => item?.projectIds) ?? [];
            const mergedProjectIds = uniqBy(
                projectAssignedGroupIds
                    .concat(projectAssignedUserIds)
                    .concat(adminProjectIds),
                (item) => item.toString(),
            );

            return mergedProjectIds;
        } catch (error) {
            this.logger.error(
                'Error in getProjectListAssignedUser service',
                error,
            );
            throw error;
        }
    }

    /**
     * Get all project ids that assigned to user by [assign directly, set is Admin of Project, assign indirectly via group]
     * @param user user data
     * @returns {array} projectList get form [assignedProjectIds, adminProjectIds, groupIds]
     */
    async getAllProjectsAssignedToUser(user: User) {
        try {
            // Get Project Assigned User
            const projectAssignedUserIds = user.assignedProjectIds || [];
            const projectAssignedUsers = await this.projectModel
                .find({
                    ...softDeleteCondition,
                    _id: {
                        $in: projectAssignedUserIds,
                    },
                })
                .select(['name']);

            // Get Project that User is admin
            const projectAdminUserIds = user.adminProjectIds || [];
            const projectAdminUsers = await this.projectModel.aggregate([
                {
                    $match: {
                        $and: [
                            { ...softDeleteCondition },
                            {
                                _id: {
                                    $in: projectAdminUserIds,
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
                {
                    $project: {
                        name: 1,
                    },
                },
                {
                    $addFields: {
                        isAdmin: true,
                    },
                },
            ]);

            // Get Project Assigned Group of User
            const groupAssignedUserIds = user.constellationGroupIds || [];
            const groupAssignedUsers = await this.groupModel
                .find({
                    ...softDeleteCondition,
                    _id: {
                        $in: groupAssignedUserIds,
                    },
                })
                .select(['name', 'projectIds']);

            const projectAssignedGroupIds = groupAssignedUsers?.flatMap(
                (item) => item?.projectIds,
            );

            let projectAssignedGroups = await this.projectModel.aggregate([
                {
                    $match: {
                        $and: [
                            { ...softDeleteCondition },
                            {
                                _id: {
                                    $in: projectAssignedGroupIds,
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
                {
                    $lookup: {
                        from: 'groups',
                        localField: '_id',
                        foreignField: 'projectIds',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'group',
                    },
                },
                {
                    $unwind: '$group',
                },
                {
                    $match: {
                        $and: [
                            { ...softDeleteCondition },
                            {
                                'group._id': {
                                    $in: groupAssignedUserIds,
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
                {
                    $project: {
                        'group._id': 1,
                        'group.name': 1,
                        name: 1,
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        groups: {
                            $push: '$group',
                        },
                    },
                },
            ]);
            projectAssignedGroups = projectAssignedGroups
                .concat(projectAssignedUsers)
                .concat(projectAdminUsers);
            return {
                items: projectAssignedGroups,
            };
        } catch (error) {
            this.logger.error(
                'Error in getAllProjectsAssignedToUser service',
                error,
            );
            throw error;
        }
    }

    async getProjectListUserCanNotAccess(user: User, query: IUserListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
            } = query;
            const ProjectIdsAssignedUser =
                await this.getAllProjectIdsUserCanAccess(user);

            if (ProjectIdsAssignedUser === null) {
                return [];
            }

            const mongooseQuery = {
                ...softDeleteCondition,
                _id: {
                    $nin: ProjectIdsAssignedUser,
                },
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
            this.logger.error(
                'Error in getProjectListUserCanNotAccess service',
                error,
            );
            throw error;
        }
    }

    async checkIfUserCanAccessProject(user: User, projectId: ObjectId) {
        try {
            const adminAccessModules = getAccessModules(
                user?.accessModules,
                UserRoles.ADMIN,
            );
            if (
                adminAccessModules.includes(
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                )
            ) {
                return true;
            }
            const userProjectIds = user.assignedProjectIds.concat(
                user.adminProjectIds,
            );

            if (
                userProjectIds.find(
                    (assignedProjectId) =>
                        assignedProjectId.toString() === projectId.toString(),
                )
            ) {
                return true;
            }

            // Get Project Assigned Group of User
            const groupAssignedUserIds = user.constellationGroupIds || [];
            const groupAssignedUsers = await this.groupModel
                .findOne({
                    ...softDeleteCondition,
                    _id: {
                        $in: groupAssignedUserIds,
                    },
                    projectIds: projectId,
                })
                .select(['name', 'projectIds']);

            return !!groupAssignedUsers;
        } catch (error) {
            this.logger.error(
                'Error in checkIfUserCanAccessProject service',
                error,
            );
        }
    }

    async removeAllConnectionsBetweenUserAndProject(
        user: UserDocument,
        projectId: ObjectId,
    ) {
        try {
            // Remove User from project_group
            // Remove project_profile of project in User
            // Set User is not admin of project
            await this.userModel.updateOne(
                {
                    _id: user._id,
                    ...softDeleteCondition,
                },
                {
                    $pull: {
                        assignedProjectIds: projectId,
                        adminProjectIds: projectId,
                        projects: {
                            projectId: projectId,
                        },
                    },
                },
            );
        } catch (error) {
            this.logger.error(
                'Error in removeAllConnectionsBetweenUserAndProject service',
                error,
            );
            throw error;
        }
    }

    async assignProjectToUser(userId: ObjectId, projectId: ObjectId) {
        try {
            await this.userModel.updateOne(
                { _id: userId },
                {
                    $addToSet: {
                        adminProjectIds: projectId,
                    },
                },
            );
        } catch (error) {
            this.logger.error('Error in assignProjectToUser service', error);
            throw error;
        }
    }

    async unassignProjectToUser(userId: ObjectId, projectId: ObjectId) {
        try {
            await this.userModel.updateOne(
                { _id: userId },
                {
                    $pull: {
                        adminProjectIds: projectId,
                    },
                },
            );
        } catch (error) {
            this.logger.error('Error in unassignProjectToUser service', error);
            throw error;
        }
    }

    checkUserHavePermission(
        loginUser: User,
        targetUserAccessModules: IUserAccessModule[],
    ) {
        const userAdminAccessModules = getAccessModules(
            loginUser.accessModules,
            UserRoles.ADMIN,
        );
        if (
            userAdminAccessModules.includes(AccessModules.SPACIALYTIC_PLATFORM)
        ) {
            return true;
        }
        const createdAccessModule = getAccessModules(
            targetUserAccessModules,
            UserRoles.NORMAL_USER,
        );
        if (
            (createdAccessModule.includes(
                AccessModules.SPACIALYTIC_CONSTELLATION,
            ) &&
                !hasSecurityPermissions(loginUser, [
                    SecurityPermissions.MANAGE_USERS_GROUPS,
                ]) &&
                !userAdminAccessModules.includes(
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                )) ||
            (createdAccessModule.includes(
                AccessModules.SPACIALYTIC_3DWEBVIEWER,
            ) &&
                !userAdminAccessModules.includes(
                    AccessModules.SPACIALYTIC_3DWEBVIEWER,
                ))
        ) {
            return false;
        }
        return true;
    }

    async getUserNotBelongToProject(query: IGetUnassignedToProjectUser) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                projectId,
                keyword = '',
            } = query;

            const mongoQuery = {
                assignedProjectIds: {
                    $ne: projectId,
                },
                adminProjectIds: {
                    $ne: projectId,
                },
                'constellationGroups.projectIds': {
                    $ne: projectId,
                },
                'accessModules.module': AccessModules.SPACIALYTIC_CONSTELLATION,
            };
            Object.assign(mongoQuery, {
                ...mongoQuery,
                ...softDeleteCondition,
            });
            if (keyword.length) {
                Object.assign(mongoQuery, {
                    ...mongoQuery,
                    email: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                });
            }

            const [items, totalItems] = await Promise.all([
                this.userModel.aggregate([
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
                        $lookup: {
                            from: 'users',
                            localField: 'approvedBy',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as Expression,
                                },
                            ],
                            as: 'approved',
                        },
                    },
                    {
                        $sort: {
                            _id: -1,
                        },
                    },
                    {
                        $project: {
                            email: 1,
                            accessModules: 1,
                            constellationGroupIds: 1,
                            constellationGroups: 1,
                            assignedProjectIds: 1,
                            adminProjectIds: 1,
                            deletedAt: 1,
                            deletedBy: 1,
                        },
                    },
                    {
                        $addFields: {
                            fullName: {
                                $concat: ['$firstName', ' ', '$lastName'],
                            },
                        },
                    },
                    {
                        $match: mongoQuery as unknown as Expression,
                    },
                    { $skip: getTotalSkipItem(page, limit) },
                    { $limit: +limit },
                ]),
                this.userModel.aggregate([
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
                        $lookup: {
                            from: 'users',
                            localField: 'approvedBy',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as Expression,
                                },
                            ],
                            as: 'approved',
                        },
                    },
                    {
                        $match: mongoQuery as unknown as Expression,
                    },
                    {
                        $group: {
                            _id: 'null',
                            cnt: { $sum: 1 },
                        },
                    },
                ]),
            ]);
            return {
                items,
                totalItems: totalItems?.[0]?.cnt,
            };
        } catch (error) {
            this.logger.error(
                'Error in getUserNotBelongToProject service',
                error,
            );
            throw error;
        }
    }

    async deleteProjectFromUser(projectId: ObjectId) {
        try {
            await this.userModel.updateMany(
                {},
                {
                    $pull: {
                        assignedProjectIds: projectId,
                        adminProjectIds: projectId,
                        projects: {
                            projectId: projectId,
                        },
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async checkIf3DViewerProfileInUse(viewer3dProfileId: ObjectId) {
        try {
            return await this.userModel.countDocuments({
                viewer3dProfileIds: viewer3dProfileId,
            });
        } catch (error) {
            this.logger.error(
                'Error in checkIf3DViewerProfileInUse service',
                error,
            );
            throw error;
        }
    }

    async checkIfProjectProfileInUse(projectProfileId: ObjectId) {
        try {
            return await this.userModel.countDocuments({
                'projects.projectProfileIds': projectProfileId,
            });
        } catch (error) {
            this.logger.error(
                'Error in checkIfProjectProfileInUse service',
                error,
            );
            throw error;
        }
    }

    async countAssignedUserToProject(projectId: ObjectId) {
        try {
            const userCount = await this.userModel.countDocuments({
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
            return userCount;
        } catch (error) {
            this.logger.error(
                'Error in countAssignedUserToProject service',
                error,
            );
            throw error;
        }
    }

    async countAssignedCompanyToProject(projectId: ObjectId) {
        try {
            const companyCount = await this.userModel.aggregate([
                {
                    $match: {
                        $or: [
                            { assignedProjectIds: new ObjectId(projectId) },
                            { adminProjectIds: new ObjectId(projectId) },
                            {
                                'constellationGroups.projectIds': new ObjectId(
                                    projectId,
                                ),
                            },
                        ],
                        company: {
                            $ne: '',
                        },
                    } as unknown as Expression,
                },
                {
                    $group: {
                        _id: '$company',
                    },
                },
                {
                    $group: {
                        _id: null,
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]);

            return companyCount?.[0]?.count || 0;
        } catch (error) {
            this.logger.error(
                'Error in countAssignedCompanyToProject service',
                error,
            );
            throw error;
        }
    }
}
