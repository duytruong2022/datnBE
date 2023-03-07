import { ParseObjectIdPipe } from '../../common/pipe/objectId.validation.pipe';
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
import { ProjectGroupMongoService } from './services/project-group.mongo.service';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import {
    IBulkCreateProjectGroupBody,
    IProjectGroupCreateBody,
    IProjectGroupListQuery,
    IProjectGroupUpdateProfileBody,
    IUserNotInProjectGroupBody,
} from './project-group.interface';
import {
    createProjectGroupSchema,
    importProjectGroupSchema,
    projectGroupListQuerySchema,
    updateProjectGroupProfileSchema,
    userNotInProjectGroupSchema,
} from './project-group.validator';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    AuditLogActions,
    AuditLogModules,
} from '../audit-log/audit-log.constant';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { uniq } from 'lodash';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import {
    ProjectLogActions,
    ProjectLogModules,
} from '../project-log/project-log.constant';
import { UserMongoService } from '../user/services/user.mongo.service';
import { ProjectPermissions } from '../project-profile/project-profile.constant';
import { ProjectMongoService } from '../project/services/project.mongo.service';
@Controller('/project-group')
@UseGuards(AuthenticationGuard)
export class ProjectGroupController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly projectGroupService: ProjectGroupMongoService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly userService: UserMongoService,
        private readonly projectService: ProjectMongoService,
    ) {
        //
    }

    @Get('/')
    async getProjectGroupList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(projectGroupListQuerySchema),
        )
        query: IProjectGroupListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                query.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        query.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            const projectGroupList =
                await this.projectGroupService.getProjectGroupList(query);
            return new SuccessResponse(projectGroupList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getProjectGroupDetail(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                projectGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        projectGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            return new SuccessResponse(projectGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/user')
    async getUserInProjectGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                projectGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        projectGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            const users =
                await this.projectGroupService.getAllUsersInProjectGroup(id);
            return new SuccessResponse(users);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/user-not-belong')
    async getUserNotInProjectGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userNotInProjectGroupSchema),
        )
        query: IUserNotInProjectGroupBody,
    ) {
        try {
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                projectGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        projectGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            const users =
                await this.projectGroupService.getAllUsersNotInProjectGroup(
                    id,
                    query,
                );
            return new SuccessResponse(users);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createProjectGroup(
        @Req() req,
        @Body(new JoiValidationPipe(createProjectGroupSchema))
        body: IProjectGroupCreateBody,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                body.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        body.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            const isProjectExist =
                await this.projectGroupService.checkProjectExist(
                    body.projectId,
                );
            if (!isProjectExist) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            let projectProfile;
            if (body?.projectProfileId) {
                projectProfile =
                    await this.projectGroupService.getProjectProfileById(
                        new ObjectId(body?.projectProfileId),
                    );

                if (!projectProfile) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.projectProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.projectProfileId = null;
            }

            const isProjectGroupNameExist =
                await this.projectGroupService.checkProjectGroupNameExists(
                    body.name,
                    body.projectId,
                );
            if (isProjectGroupNameExist) {
                const message = await this.i18n.translate(
                    'project-group.message.error.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }

            const newProjectGroup = { ...body };
            const createdProjectGroup =
                await this.projectGroupService.createProjectGroup({
                    ...newProjectGroup,
                    createdBy: new ObjectId(req?.loginUser?._id),
                });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT_GROUP,
                action: AuditLogActions.CREATE,
                targetObjectId: createdProjectGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_GROUP,
                action: ProjectLogActions.CREATE_PROJECT_GROUP,
                newData: {
                    ...createdProjectGroup,
                    projectProfile: projectProfile?.name,
                } as unknown as Record<string, unknown>,
                projectId: createdProjectGroup.projectId,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(createdProjectGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateProjectGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(createProjectGroupSchema))
        body: IProjectGroupCreateBody,
    ) {
        try {
            // check project group exist
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                projectGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        projectGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }

            // check project group profile exist
            let projectProfile;
            if (body?.projectProfileId) {
                projectProfile =
                    await this.projectGroupService.getProjectProfileById(
                        body?.projectProfileId,
                    );

                if (!projectProfile) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.projectProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.projectProfileId = null;
            }

            // check project group name exist
            const isGroupNameExist =
                await this.projectGroupService.checkProjectGroupNameExists(
                    body.name,
                    body.projectId,
                    id,
                );
            if (isGroupNameExist) {
                const message = await this.i18n.translate(
                    'project-group.message.error.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }

            // update project group
            delete body.projectId;
            const updatedGroup =
                await this.projectGroupService.updateProjectGroup(id, {
                    ...body,
                    updatedBy: new ObjectId(req?.loginUser?._id),
                });

            // create audit log
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT_GROUP,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            let oldProjectProfile;
            if (
                updatedGroup.projectProfileId?.toString() ===
                body.projectProfileId?.toString()
            ) {
                oldProjectProfile = projectProfile;
            } else {
                oldProjectProfile =
                    await this.projectGroupService.getProjectProfileById(
                        projectGroup?.projectProfileId,
                    );
            }
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_GROUP,
                action: ProjectLogActions.UPDATE_PROJECT_GROUP,
                newData: {
                    ...updatedGroup,
                    projectProfile: projectProfile?.name,
                } as unknown as Record<string, unknown>,
                oldData: {
                    ...projectGroup,
                    projectProfile: oldProjectProfile?.name,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(projectGroup.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/project-profile')
    async updateProjectProfile(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(updateProjectGroupProfileSchema))
        body: IProjectGroupUpdateProfileBody,
    ) {
        try {
            // check project group exist
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                projectGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        projectGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }

            // check project group profile exist
            let projectProfile;
            if (body?.projectProfileId) {
                projectProfile =
                    await this.projectGroupService.getProjectProfileById(
                        body?.projectProfileId,
                    );

                if (!projectProfile) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.projectProfileNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectProfileId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                body.projectProfileId = null;
            }

            // update project profile
            const updatedGroup =
                await this.projectGroupService.updateProjectGroup(id, {
                    ...body,
                    updatedBy: new ObjectId(req?.loginUser?._id),
                });

            // create audit log
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT_GROUP,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedGroup._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            let oldProjectProfile;
            if (
                projectGroup.projectProfileId?.toString() ===
                body.projectProfileId?.toString()
            ) {
                oldProjectProfile = projectProfile;
            } else {
                oldProjectProfile =
                    await this.projectGroupService.getProjectProfileById(
                        projectGroup?.projectProfileId,
                    );
            }
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_GROUP,
                action: ProjectLogActions.UPDATE_PROJECT_GROUP,
                newData: {
                    ...updatedGroup,
                    projectProfile: projectProfile?.name,
                } as unknown as Record<string, unknown>,
                oldData: {
                    ...projectGroup,
                    projectProfile: oldProjectProfile?.name,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(projectGroup.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedGroup);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    async deleteProjectGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const oldGroup =
                await this.projectGroupService.getProjectGroupDetail(id);
            if (!oldGroup) {
                const message = await this.i18n.translate(
                    'project-group.message.error.itemNotExist',
                );

                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const project = await this.projectService.getProjectById(
                oldGroup.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        oldGroup.projectId,
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }

            const user =
                await this.projectGroupService.checkMemberProjectGroupExist(id);
            if (user) {
                const message = await this.i18n.t(
                    'project-group.message.error.memberGroupExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'user',
                        message,
                        errorCode: HttpStatus.ITEM_IS_USING,
                    },
                ]);
            }

            await this.projectGroupService.deleteProjectGroup(id, {
                deletedAt: new Date(),
                deletedBy: new ObjectId(req?.loginUser?._id),
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT_GROUP,
                action: AuditLogActions.DELETE,
                targetObjectId: id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const oldProjectProfile =
                await this.projectGroupService.getProjectProfileById(
                    oldGroup?.projectProfileId,
                );
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_GROUP,
                action: ProjectLogActions.DELETE_PROJECT_GROUP,
                oldData: {
                    ...oldGroup,
                    projectProfile: oldProjectProfile?.name,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(oldGroup.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('bulk-create')
    async importGroups(
        @Req() req,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(importProjectGroupSchema),
        )
        body: IBulkCreateProjectGroupBody,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                body.projectId,
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project-group.message.error.projectNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectNotExist',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            if (
                project.adminId?.toString() !== req.loginUser?._id?.toString()
            ) {
                const permissions =
                    await this.userService.getProjectSecurityPermissionsOfUser(
                        new ObjectId(req.loginUser._id),
                        new ObjectId(body.projectId),
                    );
                if (
                    !permissions.includes(
                        ProjectPermissions.GENERAL_MANAGE_USER_GROUP_OF_PROJECT,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'project-group.message.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }
            // check group name exists?
            const groupNames =
                await this.projectGroupService.getProjectGroupName(
                    uniq(body.groups.map((importGroup) => importGroup.name)),
                    body.accessModule,
                    body.projectId,
                );

            const projectProfiles =
                await this.projectGroupService.getProjectProfiles(
                    uniq(
                        body.groups.map(
                            (importGroup) => importGroup.projectProfile,
                        ),
                    ),
                    body.projectId,
                );

            const validationResults = await Promise.all(
                body.groups.map((group) =>
                    this.projectGroupService.validateImportGroup(
                        group,
                        groupNames,
                        projectProfiles,
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
                this.projectGroupService.bulkCreateProjectGroups(
                    body.groups.map((group) => {
                        return this.projectGroupService.mapImportProjectGroup(
                            group,
                            req?.loginUser?._id,
                            body.accessModule,
                            body.projectId,
                            projectProfiles,
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
