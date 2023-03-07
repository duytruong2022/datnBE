import { ParseObjectIdPipe } from './../../common/pipe/objectId.validation.pipe';
import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { GroupMongoService } from './services/group.mongo.service';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import {
    IBulkCreateGroupBody,
    IGroupCreateBody,
    IGroupListQuery,
    IGroupUpdateProfileBody,
    IGroupUpdateProjectIdsBody,
} from './group.interface';
import {
    createGroupSchema,
    groupListQuerySchema,
    ImportGroupSchema,
    updateProjectIdsGroupSchema,
} from './group.validator';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { AccessModules, HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    AuditLogActions,
    AuditLogModules,
} from '../audit-log/audit-log.constant';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { uniq } from 'lodash';
import { IUserListQuery } from '../user/user.interface';
import { userListQuerySchema } from '../user/user.validator';
import { updateProfileGroupSchema } from '../project-group/project-group.validator';
import { IGetProjectQueryString } from '../project/project.interface';
import { ProjectListQueryStringSchema } from '../project/project.validator';
import { UpdateGroupAction } from './group.constant';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import {
    ProjectLogActions,
    ProjectLogModules,
} from '../project-log/project-log.constant';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { SecurityPermissions } from '../security-profile/security-profile.constant';
import { UserMongoService } from '../user/services/user.mongo.service';
@Controller('/group')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
export class GroupController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly groupService: GroupMongoService,
        private readonly projectService: ProjectMongoService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly userService: UserMongoService,
    ) {
        //
    }

    @Get('/')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async getGroupList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(groupListQuerySchema),
        )
        query: IGroupListQuery,
    ) {
        try {
            const groupList = await this.groupService.getGroupList(query);
            return new SuccessResponse(groupList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/user')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async getAllUsersInGroup(@Param('id', ParseObjectIdPipe) id: ObjectId) {
        try {
            const group = await this.groupService.getGroupDetail(id);
            if (!group) {
                const message = await this.i18n.translate(
                    'group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const users = await this.groupService.getAllUsersInGroup(
                id,
                group.accessModule,
            );
            return new SuccessResponse(users);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/user-not-belong')
    async getUserListNotInGroup(
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userListQuerySchema),
        )
        query: IUserListQuery,
    ) {
        try {
            const group = await this.groupService.getGroupDetail(id);
            if (!group) {
                const message = await this.i18n.translate(
                    'group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const users = await this.groupService.getUserListNotInGroup(
                id,
                group.accessModule,
                query,
            );
            return new SuccessResponse(users);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/project-not-belong')
    async getProjectListNotInGroup(
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ProjectListQueryStringSchema),
        )
        query: IGetProjectQueryString,
    ) {
        try {
            const group = await this.groupService.getGroupDetail(id);
            if (!group) {
                const message = await this.i18n.translate(
                    'group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const users = await this.groupService.getProjectListNotInGroup(
                group.projectIds,
                query,
            );
            return new SuccessResponse(users);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async getGroupDetail(@Param('id', ParseObjectIdPipe) id: ObjectId) {
        try {
            const group = await this.groupService.getGroupDetail(id);
            if (!group) {
                const message = await this.i18n.translate(
                    'group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(group);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async createGroup(
        @Req() req,
        @Body(new JoiValidationPipe(createGroupSchema)) body: IGroupCreateBody,
    ) {
        try {
            if (body?.securityProfileId) {
                const isSecurityProfileExist =
                    await this.groupService.getSecurityProfileById(
                        body?.securityProfileId,
                    );
                if (!isSecurityProfileExist) {
                    const message = await this.i18n.translate(
                        'group.message.error.securityProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'securityProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.securityProfileId = null;
            }

            if (body?.viewer3dProfileId) {
                const checkViewer3dProfile =
                    await this.groupService.checkViewer3dProfileExist(
                        new ObjectId(body?.viewer3dProfileId),
                    );
                if (!checkViewer3dProfile) {
                    const message = await this.i18n.translate(
                        'group.message.error.viewer3dProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.viewer3dProfileId = null;
            }

            const isGroupNameExist =
                await this.groupService.checkGroupNameExists(
                    body.name,
                    body.accessModule,
                );
            if (isGroupNameExist) {
                const message = await this.i18n.translate(
                    'group.message.error.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }

            const newGroup = { ...body };
            const createdGroup = await this.groupService.createGroup({
                ...newGroup,
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.GROUP,
                action: AuditLogActions.CREATE,
                targetObjectId: createdGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(createdGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async updateGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(createGroupSchema)) body: IGroupCreateBody,
    ) {
        try {
            if (body?.securityProfileId) {
                const checkSecurityProfile =
                    await this.groupService.getSecurityProfileById(
                        new ObjectId(body?.securityProfileId),
                    );
                if (!checkSecurityProfile) {
                    const message = await this.i18n.translate(
                        'group.message.error.securityProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'securityProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.securityProfileId = null;
            }

            if (body?.viewer3dProfileId) {
                const checkViewer3dProfile =
                    await this.groupService.checkViewer3dProfileExist(
                        new ObjectId(body?.viewer3dProfileId),
                    );
                if (!checkViewer3dProfile) {
                    const message = await this.i18n.translate(
                        'group.message.error.viewer3dProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.viewer3dProfileId = null;
            }

            const isGroupNameExist =
                await this.groupService.checkGroupNameExists(
                    body.name,
                    body.accessModule,
                    id,
                );
            if (isGroupNameExist) {
                const message = await this.i18n.translate(
                    'group.message.error.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }
            const group = { ...body };
            const updatedGroup = await this.groupService.updateGroup(id, {
                ...group,
                updatedBy: new ObjectId(req?.loginUser?._id),
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.GROUP,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id/profile')
    @Permissions([
        SecurityPermissions.ASSIGN_SECURITY_PROFILE,
        SecurityPermissions.MANAGE_USERS_GROUPS,
    ])
    async updateProfileGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(updateProfileGroupSchema))
        body: IGroupUpdateProfileBody,
    ) {
        try {
            if (body?.securityProfileId) {
                const checkSecurityProfile =
                    await this.groupService.getSecurityProfileById(
                        new ObjectId(body?.securityProfileId),
                    );
                if (!checkSecurityProfile) {
                    const message = await this.i18n.translate(
                        'group.message.error.securityProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'securityProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.securityProfileId = null;
            }

            if (body?.viewer3dProfileId) {
                const checkViewer3dProfile =
                    await this.groupService.checkViewer3dProfileExist(
                        new ObjectId(body?.viewer3dProfileId),
                    );
                if (!checkViewer3dProfile) {
                    const message = await this.i18n.translate(
                        'group.message.error.viewer3dProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.viewer3dProfileId = null;
            }

            const group = { ...body };
            const updatedGroup = await this.groupService.updateProfileGroup(
                id,
                {
                    ...group,
                    updatedBy: new ObjectId(req?.loginUser?._id),
                },
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.GROUP,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/project')
    @Permissions([
        SecurityPermissions.ASSIGN_USER_GROUP_TO_PROJECT,
        SecurityPermissions.MANAGE_USERS_GROUPS,
    ])
    async updateProjectAssignedGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(updateProjectIdsGroupSchema),
        )
        body: IGroupUpdateProjectIdsBody,
    ) {
        try {
            const group = await this.groupService.getGroupDetail(id);
            // check user group
            if (!group) {
                const message = await this.i18n.translate('group.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            // check exist project
            const project = await this.projectService.getProjectById(
                body.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'group.update.project.notExists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'groupId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            let updateBody = group.projectIds || [];
            // if assign user to group, check groupIds of user includes groupId
            if (body.action === UpdateGroupAction.ASSIGN_PROJECT) {
                if (group.projectIds?.includes(body.projectId)) {
                    const message = await this.i18n.translate(
                        'group.update.project.exists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        },
                    ]);
                } else {
                    updateBody.push(new ObjectId(body.projectId));
                }
            }
            // if remove user from group, check groupIds of user includes groupId
            else if (body.action === UpdateGroupAction.REMOVE_PROJECT) {
                if (!group.projectIds?.includes(body.projectId)) {
                    const message = await this.i18n.translate(
                        'group.update.project.notExists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                } else {
                    updateBody = updateBody.filter(
                        (item) => item.toString() !== body.projectId.toString(),
                    );

                    const users = await this.groupService.getAllUsersInGroup(
                        id,
                        AccessModules.SPACIALYTIC_CONSTELLATION,
                    );
                    if (users?.items?.length) {
                        users.items.forEach(async (user) => {
                            if (
                                !(await this.userService.checkIfUserCanAccessProject(
                                    user,
                                    project._id,
                                ))
                            ) {
                                this.userService.removeAllConnectionsBetweenUserAndProject(
                                    user,
                                    project._id,
                                );
                            }
                        });
                    }
                }
            }

            // if confirm change Security Profile of User
            const updatedGroup = await this.groupService.updateGroup(id, {
                projectIds: updateBody,
                updatedBy: req?.loginUser?._id,
            });

            this.auditLogService.createAuditLog({
                module: AuditLogModules.GROUP,
                action: AuditLogActions.UPDATE,
                targetObjectId: id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const securityProfile =
                await this.groupService.getSecurityProfileById(
                    new ObjectId(updatedGroup?.securityProfileId),
                );

            this.projectLogService.createProjectLog({
                module: ProjectLogModules.GROUP,
                action:
                    body.action === UpdateGroupAction.ASSIGN_PROJECT
                        ? ProjectLogActions.ASSIGN_TO_PROJECT_GROUP
                        : ProjectLogActions.REMOVE_FROM_PROJECT_GROUP,
                newData:
                    body.action === UpdateGroupAction.ASSIGN_PROJECT
                        ? ({
                              ...updatedGroup.toJSON(),
                              constellationProfile: securityProfile?.name,
                          } as unknown as Record<string, unknown>)
                        : null,
                oldData:
                    body.action === UpdateGroupAction.ASSIGN_PROJECT
                        ? null
                        : ({
                              ...updatedGroup.toJSON(),
                              constellationProfile: securityProfile?.name,
                          } as unknown as Record<string, unknown>),
                projectId: new ObjectId(body.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse({
                updatedGroup,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async deleteGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const oldGroup = await this.groupService.getGroupDetail(id);
            if (!oldGroup) {
                const message = await this.i18n.translate(
                    'group.message.error.itemNotExist',
                );

                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const user = await this.groupService.checkMemberGroupExist(
                id,
                oldGroup.accessModule,
            );
            if (user) {
                const message = await this.i18n.t(
                    'group.message.error.memberGroupExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'user',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }

            await this.groupService.deleteGroup(id, {
                deletedAt: new Date(),
                deletedBy: new ObjectId(req?.loginUser?._id),
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.GROUP,
                action: AuditLogActions.DELETE,
                targetObjectId: id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('bulk-create')
    @Permissions([SecurityPermissions.MANAGE_USERS_GROUPS])
    async importGroups(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(ImportGroupSchema))
        body: IBulkCreateGroupBody,
    ) {
        try {
            // check group name exists?
            const groupNames = await this.groupService.getGroupName(
                uniq(body.groups.map((importGroup) => importGroup.name)),
                body.accessModule,
            );

            const securityProfiles =
                await this.groupService.getSecurityProfiles(
                    uniq(
                        body.groups.map(
                            (importGroup) => importGroup.securityProfile,
                        ),
                    ),
                );

            const viewer3dProfiles =
                await this.groupService.getViewer3dProfiles(
                    uniq(
                        body.groups.map(
                            (importGroup) => importGroup.viewer3dProfile,
                        ),
                    ),
                );

            const validationResults = await Promise.all(
                body.groups.map((group) =>
                    this.groupService.validateImportGroup(
                        group,
                        groupNames,
                        securityProfiles,
                        viewer3dProfiles,
                    ),
                ),
            );

            let importGroupResults;
            validationResults.forEach((validationResult) => {
                importGroupResults = {
                    ...importGroupResults,
                    [validationResult.index]: validationResult.validationResult,
                };
            });

            if (
                !validationResults.some(
                    (validationResult) =>
                        !validationResult.validationResult.isValid,
                )
            ) {
                this.groupService.bulkCreateGroups(
                    body.groups.map((group) => {
                        return this.groupService.mapImportGroup(
                            group,
                            req?.loginUser?._id,
                            body.accessModule,
                            securityProfiles,
                            viewer3dProfiles,
                        );
                    }),
                );
            }

            return new SuccessResponse({
                results: importGroupResults,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
