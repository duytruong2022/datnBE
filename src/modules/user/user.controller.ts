import { GroupMongoService } from './../group/services/group.mongo.service';
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
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import * as randomstring from 'randomstring';
import { UserMongoService } from './services/user.mongo.service';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import {
    AccessModules,
    HttpStatus,
    UserRoles,
    UserStatus,
    UserTokenTypes,
} from 'src/common/constants';
import {
    assignPbsProfileSchema,
    contactUserSchema,
    createUserSchema,
    getUserNotInProject,
    ImportUserSchema,
    resetPasswordFormSchema,
    setPasswordFormSchema,
    updateGroupIdsUserSchema,
    updateProjectGroupIdsUserSchema,
    updateUserProjectIdsSchema,
    updateUserSchema,
    userListQuerySchema,
} from './user.validator';
import {
    IAssignPbsProfileBody,
    IBulkCreateUserBody,
    IContact,
    IResetPasswordBody,
    ISetPasswordBody,
    IUserCreateBody,
    IUserListQuery,
    IUserUpdateBody,
    IUserUpdateGroupIdsBody,
    IUserUpdateProjectGroupIdsBody,
    IUserUpdateProjectIdsBody,
} from './user.interface';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { ObjectId } from 'mongodb';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import {
    AuditLogModules,
    AuditLogActions,
} from '../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    ACCOUNT_ACTIVATION_KEY_LENGTH,
    activeAccountKeyExpiredIn,
    RegistrationFrom,
    RESET_PASSWORD_LENGTH,
    SENDGRID_SEND_MAIL_SUCCESS_CODE,
    UpdateProjectUserAction,
} from './user.constant';
import ConfigKey from 'src/common/config/config-key';
import intersection from 'lodash/intersection';
import { differenceBy, uniq } from 'lodash';
import {
    getAccessModules,
    hashPassword,
    hasSecurityPermissions,
} from 'src/common/helpers/commonFunctions';
import { NotificationMongoService } from '../notification/services/notification.mongo.service';
import { AuthMongoService } from '../auth/services/auth.mongo.service';
import { SendGridService } from 'src/common/services/sendgrid.service';
import { ImportUserService } from './services/user.import.service';
import { UpdateGroupAction } from '../group/group.constant';
import { GroupDocument } from '../group/mongo-schemas/group.schema';
import { ProjectGroupDocument } from '../project-group/mongo-schemas/project-group.schema';
import { ProjectGroupMongoService } from '../project-group/services/project-group.mongo.service';
import { UpdateProjectGroupAction } from '../project-group/project-group.constant';
import { IGetProjectQueryString } from '../project/project.interface';
import { ProjectListQueryStringSchema } from '../project/project.validator';
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
import { ProjectPermissions } from '../project-profile/project-profile.constant';
import moment from 'moment';

@Controller('/user')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
export class UserController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly userService: UserMongoService,
        private readonly importUserService: ImportUserService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly notificationService: NotificationMongoService,
        private readonly authService: AuthMongoService,
        private readonly sendGridService: SendGridService,
        private readonly groupService: GroupMongoService,
        private readonly projectService: ProjectMongoService,
        private readonly projectGroupService: ProjectGroupMongoService,
    ) {
        //
    }

    @Get('/')
    async getUserList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userListQuerySchema),
        )
        query: IUserListQuery,
    ) {
        try {
            const loginUserAccessModules = getAccessModules(
                req?.loginUser?.accessModules,
                UserRoles.NORMAL_USER,
            ).concat(
                getAccessModules(
                    req?.loginUser?.accessModules,
                    UserRoles.ADMIN,
                ),
            );

            if (!loginUserAccessModules.length)
                return new SuccessResponse({ items: [], totalItems: 0 });

            if (
                !query.accessModules?.length &&
                loginUserAccessModules.includes(
                    AccessModules.SPACIALYTIC_PLATFORM,
                )
            ) {
                query.accessModules = [];
            } else if (
                query.accessModules?.length &&
                loginUserAccessModules.includes(
                    AccessModules.SPACIALYTIC_PLATFORM,
                )
            ) {
                query.accessModules = query.accessModules;
            } else {
                query.accessModules = query.accessModules?.length
                    ? intersection(loginUserAccessModules, query.accessModules)
                    : loginUserAccessModules;
            }

            const userList = await this.userService.getUserList(query);

            return new SuccessResponse(userList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('not-in-project')
    async getUserNotBelongToProject(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(getUserNotInProject),
        )
        query: IUserListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                new ObjectId(query.projectId),
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'project.errors.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const { items, totalItems } =
                await this.userService.getUserNotBelongToProject({
                    projectId: new ObjectId(query.projectId),
                    page: query.page,
                    limit: query.limit,
                    keyword: query.keyword,
                });
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getUserDetail(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const user = await this.userService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            return new SuccessResponse(user);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createUser(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(createUserSchema))
        body: IUserCreateBody,
    ) {
        try {
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    body.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const newUser = { ...body };
            const isEmailExist = await this.userService.checkEmailExist(
                body?.email,
            );
            if (isEmailExist) {
                const message = await this.i18n.t(
                    'user.create.email.duplicate',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'email',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }

            const country = await this.userService.getCountryById(
                body?.countryId,
            );
            if (!country) {
                const message = await this.i18n.t(
                    'user.create.country.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'countryId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            if (newUser.viewer3dGroupIds?.length) {
                const isGroupExist = await this.userService.checkGroupExists(
                    body?.viewer3dGroupIds,
                    AccessModules.SPACIALYTIC_3DWEBVIEWER,
                );
                if (!isGroupExist) {
                    const message = await this.i18n.t(
                        'user.create.group.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dGroupIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (newUser.constellationGroupIds?.length) {
                const isGroupExist = await this.userService.checkGroupExists(
                    body?.constellationGroupIds,
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                );
                if (!isGroupExist) {
                    const message = await this.i18n.t(
                        'user.create.group.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'constellationGroupIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (newUser.securityProfileIds?.length) {
                const isSecurityProfileExist =
                    await this.userService.checkSecurityProfileExists(
                        body?.securityProfileIds,
                    );
                if (!isSecurityProfileExist) {
                    const message = await this.i18n.t(
                        'user.create.securityProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'securityProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (newUser.viewer3dProfileIds?.length) {
                const isViewer3dProfileIdsExist =
                    await this.userService.checkViewer3dProfileIdsExists(
                        body?.viewer3dProfileIds,
                    );
                if (!isViewer3dProfileIdsExist) {
                    const message = await this.i18n.t(
                        'user.create.viewer3dProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (newUser.projectProfileIds?.length) {
                const isProjectProfileIdsExist =
                    await this.userService.checkProjectProfileIdsExists(
                        body?.projectProfileIds,
                    );
                if (!isProjectProfileIdsExist) {
                    const message = await this.i18n.t(
                        'user.create.projectProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (newUser.projectId) {
                const project = await this.userService.checkProjectIdsExists(
                    body?.projectId,
                );
                if (!project) {
                    const message = await this.i18n.t(
                        'user.create.project.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }

                newUser.projects = [
                    {
                        projectId: new ObjectId(body.projectId),
                        projectProfileIds: body.projectProfileIds.map(
                            (projectProfileId) =>
                                new ObjectId(projectProfileId),
                        ),
                        projectGroupIds: body.projectGroupIds.map(
                            (projectProfileId) =>
                                new ObjectId(projectProfileId),
                        ),
                    },
                ];

                newUser.assignedProjectIds = [new ObjectId(body.projectId)];
            }

            const createdUser = await this.userService.createUser({
                ...newUser,
                status: UserStatus.REGISTERING,
                registrationFrom: RegistrationFrom.ADMIN_CREATE,
                createdBy: req?.loginUser?._id,
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.CREATE,
                targetObjectId: createdUser._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            if (newUser.projectId) {
                this.projectLogService.createProjectLog({
                    module: ProjectLogModules.USER,
                    action: ProjectLogActions.CREATE_USER,
                    newData: {
                        ...createdUser.toJSON(),
                        country: country.name,
                    } as unknown as Record<string, unknown>,
                    projectId: new ObjectId(body.projectId),
                    description: '',
                    createdBy: new ObjectId(req?.loginUser?._id),
                });
            }
            this.sendGridService.sendMail({
                to: newUser.email,
                from: this.configService.get(ConfigKey.SENDGRID_SENDER),
                templateId: this.configService.get(
                    ConfigKey.SENDGRID_TEMPLATE_ID_ACCOUNT_CREATED_INFORM,
                ),
                dynamicTemplateData: {
                    fullName: `${newUser.firstName} ${newUser.lastName}`,
                },
            });
            return new SuccessResponse(createdUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/project/:projectId')
    async updateProjectUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Param('projectId', ParseObjectIdPipe) projectId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(updateUserSchema))
        body: IUserUpdateBody,
    ) {
        try {
            const oldUser = await this.userService.getUserById(id);
            if (!oldUser) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    body.accessModules,
                ) ||
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    oldUser.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            const project = await this.userService.checkProjectIdsExists(
                projectId,
            );
            if (!project) {
                const message = await this.i18n.t(
                    'user.create.project.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectIds',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const country = await this.userService.getCountryById(
                body?.countryId,
            );
            if (!country) {
                const message = await this.i18n.t(
                    'user.create.country.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'countryId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            if (body.projectGroupIds?.length) {
                const isGroupExist =
                    await this.userService.checkProjectGroupExists(
                        body?.projectGroupIds,
                    );
                if (!isGroupExist) {
                    const message = await this.i18n.t(
                        'user.create.group.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectGroupIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (body.projectProfileIds?.length) {
                const isProjectProfileIdsExist =
                    await this.userService.checkProjectProfileIdsExists(
                        body?.projectProfileIds,
                    );
                if (!isProjectProfileIdsExist) {
                    const message = await this.i18n.t(
                        'user.create.projectProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            const userProject = {
                projectId,
                projectProfileIds: body.projectProfileIds?.map(
                    (projectProfileId) => new ObjectId(projectProfileId),
                ),
                projectGroupIds: body.projectGroupIds?.map(
                    (projectProfileId) => new ObjectId(projectProfileId),
                ),
            };

            if (oldUser.projects?.length) {
                const projectIndex = oldUser.projects.findIndex(
                    (project) =>
                        project.projectId.toString() === projectId.toString(),
                );

                if (projectIndex !== -1) {
                    oldUser.projects[projectIndex] = {
                        ...oldUser.projects[projectIndex],
                        ...userProject,
                    };
                    body.projects = oldUser.projects;
                } else {
                    oldUser.projects.push(userProject);
                    body.projects = oldUser.projects;
                }
            } else {
                body.projects = [userProject];
            }

            const updatedUser = await this.userService.updateUser(id, {
                ...body,
                updatedBy: req?.loginUser?._id,
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedUser._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            let oldCountry;
            if (oldUser.countryId.toString() === body.countryId.toString()) {
                oldCountry = country;
            } else {
                oldCountry = await this.userService.getCountryById(
                    oldUser?.countryId,
                );
            }

            this.projectLogService.createProjectLog({
                module: ProjectLogModules.USER,
                action: ProjectLogActions.UPDATE_USER,
                newData: {
                    ...updatedUser.toJSON(),
                    country: country.name,
                } as unknown as Record<string, unknown>,
                oldData: {
                    ...oldUser.toJSON(),
                    country: oldCountry?.name,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse(updatedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/pbs-profile/:projectId')
    async updatePbsProfileUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Param('projectId', ParseObjectIdPipe) projectId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(assignPbsProfileSchema))
        body: IAssignPbsProfileBody,
    ) {
        try {
            const oldUser = (await this.userService.getUserById(id)).toObject();
            if (!oldUser) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const project = await this.userService.checkProjectIdsExists(
                projectId,
            );
            if (!project) {
                const message = await this.i18n.t(
                    'user.create.project.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectIds',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const pbsProfile = {
                pbsGroupId: new ObjectId(body.pbsGroupId),
                projectProfileIds: body.projectProfileIds?.map(
                    (profileId) => new ObjectId(profileId),
                ),
            };

            if (oldUser.projects?.length) {
                const projectIndex = oldUser.projects.findIndex(
                    (project) =>
                        project.projectId?.toString() === projectId.toString(),
                );

                if (projectIndex !== -1) {
                    const pbsProfileIndex = oldUser.projects[
                        projectIndex
                    ]?.pbsProfiles?.findIndex(
                        (pbsProfile) =>
                            pbsProfile.pbsGroupId?.toString() ===
                            body.pbsGroupId.toString(),
                    );

                    if (
                        pbsProfileIndex !== undefined &&
                        pbsProfileIndex !== -1
                    ) {
                        oldUser.projects[projectIndex].pbsProfiles[
                            pbsProfileIndex
                        ] = pbsProfile;
                    } else if (
                        oldUser.projects[projectIndex].pbsProfiles?.length
                    ) {
                        oldUser.projects[projectIndex].pbsProfiles.push(
                            pbsProfile,
                        );
                    } else {
                        oldUser.projects[projectIndex].pbsProfiles = [
                            pbsProfile,
                        ];
                    }
                } else {
                    oldUser.projects.push({
                        projectId,
                        projectGroupIds: [],
                        projectProfileIds: [],
                        pbsProfiles: [pbsProfile],
                    });
                }
            } else {
                oldUser.projects = [
                    {
                        projectId,
                        projectGroupIds: [],
                        projectProfileIds: [],
                        pbsProfiles: [pbsProfile],
                    },
                ];
            }

            const updatedUser = await this.userService.updateUser(id, {
                ...oldUser,
                updatedBy: req?.loginUser?._id,
            });

            return new SuccessResponse(updatedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(updateUserSchema))
        body: IUserUpdateBody,
    ) {
        try {
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    body.accessModules,
                ) ||
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    body.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            const oldUser = await this.userService.getUserById(id);
            if (!oldUser) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const updatedSecurityProfileIds = differenceBy(
                oldUser.securityProfileIds,
                body.securityProfileIds,
                (id) => id.toString(),
            );
            if (
                updatedSecurityProfileIds.length &&
                !hasSecurityPermissions(req?.loginUser, [
                    SecurityPermissions.ASSIGN_SECURITY_PROFILE,
                ])
            ) {
                const message = await this.i18n.translate(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            const country = await this.userService.getCountryById(
                body?.countryId,
            );
            if (!country) {
                const message = await this.i18n.t(
                    'user.create.country.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'countryId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            if (body.viewer3dGroupIds?.length) {
                const isGroupExist = await this.userService.checkGroupExists(
                    body?.viewer3dGroupIds,
                    AccessModules.SPACIALYTIC_3DWEBVIEWER,
                );
                if (!isGroupExist) {
                    const message = await this.i18n.t(
                        'user.create.group.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dGroupIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (body.constellationGroupIds?.length) {
                const isGroupExist = await this.userService.checkGroupExists(
                    body?.constellationGroupIds,
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                );
                if (!isGroupExist) {
                    const message = await this.i18n.t(
                        'user.create.group.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'constellationGroupIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (body.viewer3dProfileIds?.length) {
                const isViewer3dProfileIdsExist =
                    await this.userService.checkViewer3dProfileIdsExists(
                        body?.viewer3dProfileIds,
                    );
                if (!isViewer3dProfileIdsExist) {
                    const message = await this.i18n.t(
                        'user.create.viewer3dProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'viewer3dProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (body.securityProfileIds?.length) {
                const isSecurityProfileExist =
                    await this.userService.checkSecurityProfileExists(
                        body?.securityProfileIds,
                    );
                if (!isSecurityProfileExist) {
                    const message = await this.i18n.t(
                        'user.create.securityProfile.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'securityProfileIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (
                oldUser.accessModules.find(
                    (accessModule) =>
                        accessModule.module ===
                        AccessModules.SPACIALYTIC_CONSTELLATION,
                ) &&
                !body.accessModules.find(
                    (accessModule) =>
                        accessModule.module ===
                        AccessModules.SPACIALYTIC_CONSTELLATION,
                ) &&
                (oldUser.assignedProjectIds?.length ||
                    oldUser.constellationGroupIds?.length)
            ) {
                const message = await this.i18n.t(
                    'user.update.constellationAccessModule',
                );
                return new ErrorResponse(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    message,
                    [],
                );
            }

            if (
                oldUser.accessModules.find(
                    (accessModule) =>
                        accessModule.module ===
                        AccessModules.SPACIALYTIC_3DWEBVIEWER,
                ) &&
                !body.accessModules.find(
                    (accessModule) =>
                        accessModule.module ===
                        AccessModules.SPACIALYTIC_3DWEBVIEWER,
                ) &&
                oldUser.viewer3dGroupIds?.length
            ) {
                const message = await this.i18n.t(
                    'user.update.viewer3dAccessModule',
                );
                return new ErrorResponse(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    message,
                    [],
                );
            }

            const accessModules = getAccessModules(
                body.accessModules,
                UserRoles.NORMAL_USER,
            ).concat(getAccessModules(body.accessModules, UserRoles.ADMIN));
            if (
                !accessModules.includes(AccessModules.SPACIALYTIC_CONSTELLATION)
            ) {
                await this.projectService.unassignProjectAdmin(id);
            }

            const updatedUser = await this.userService.updateUser(id, {
                ...body,
                updatedBy: req?.loginUser?._id,
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedUser._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/group')
    async updateGroupIdsUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(updateGroupIdsUserSchema),
        )
        body: IUserUpdateGroupIdsBody,
    ) {
        try {
            const user = await this.userService.getUserById(id);
            // check user exist
            if (!user) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            // check exist group
            const group = await this.groupService.getGroupDetail(body.groupId);
            if (!group) {
                const message = await this.i18n.translate(
                    'user.update.group.notExists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'groupId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            if (
                group.accessModule === AccessModules.SPACIALYTIC_CONSTELLATION
            ) {
                // if assign user to group, check groupIds of user includes groupId
                if (
                    user.constellationGroupIds?.includes(body.groupId) &&
                    body.action === UpdateGroupAction.ASSIGN_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.group.exists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        },
                    ]);
                }
                // if remove user from group, check groupIds of user includes groupId

                if (
                    !user.constellationGroupIds?.includes(body.groupId) &&
                    body.action === UpdateGroupAction.REMOVE_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.group.notExists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            if (group.accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER) {
                // if assign user to group, check groupIds of user includes groupId
                if (
                    user.viewer3dGroupIds?.includes(body.groupId) &&
                    body.action === UpdateGroupAction.ASSIGN_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.group.exists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        },
                    ]);
                }
                // if remove user from group, check groupIds of user includes groupId

                if (
                    !user.viewer3dGroupIds?.includes(body.groupId) &&
                    body.action === UpdateGroupAction.REMOVE_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.group.notExists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'groupId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            // check Change SecurityProfile of User
            const isChangeProfile =
                group.accessModule === AccessModules.SPACIALYTIC_CONSTELLATION
                    ? await this.userService.checkChangeSecurityProfile(
                          id,
                          group.securityProfileId,
                      )
                    : await this.userService.checkChangeViewer3dProfile(
                          id,
                          group.viewer3dProfileId,
                      );
            if (!isChangeProfile || body.isConfirm) {
                let updatedUser;
                if (
                    group.accessModule ===
                    AccessModules.SPACIALYTIC_CONSTELLATION
                ) {
                    updatedUser =
                        await this.userService.updateConstellationGroupIdsUser(
                            id,
                            {
                                ...body,
                                updatedBy: req?.loginUser?._id,
                            },
                        );

                    if (group?.projectIds?.length) {
                        group.projectIds.forEach(async (projectId) => {
                            if (
                                !(await this.userService.checkIfUserCanAccessProject(
                                    updatedUser,
                                    projectId,
                                ))
                            ) {
                                this.userService.removeAllConnectionsBetweenUserAndProject(
                                    updatedUser,
                                    projectId,
                                );
                            }
                        });
                    }
                } else if (
                    group.accessModule === AccessModules.SPACIALYTIC_3DWEBVIEWER
                ) {
                    updatedUser =
                        await this.userService.updateViewer3dGroupIdsUser(id, {
                            ...body,
                            updatedBy: req?.loginUser?._id,
                        });
                }

                this.auditLogService.createAuditLog({
                    module: AuditLogModules.USER,
                    action: AuditLogActions.UPDATE,
                    targetObjectId: updatedUser._id,
                    description: '',
                    createdBy: new ObjectId(req?.loginUser?._id),
                });
                return new SuccessResponse({
                    isChangeProfile,
                    updatedUser,
                });
            }
            if (isChangeProfile) {
                return new SuccessResponse({
                    isChangeProfile: isChangeProfile,
                });
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/project-group')
    async updateProjectGroup(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(updateProjectGroupIdsUserSchema),
        )
        body: IUserUpdateProjectGroupIdsBody,
    ) {
        try {
            const user = await this.userService.getUserById(id);

            // check user exist
            if (!user) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const selectedProject = await this.projectService.getProjectById(
                body.projectId,
            );
            if (!selectedProject) {
                const message = await this.i18n.translate(
                    'user.errors.project.notExists',
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
                selectedProject.adminId?.toString() !==
                req.loginUser?._id?.toString()
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
                        'user.errors.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }

            // check exist project group
            const projectGroup =
                await this.projectGroupService.getProjectGroupDetail(
                    new ObjectId(body.projectGroupId),
                );

            if (!projectGroup) {
                const message = await this.i18n.translate(
                    'user.update.projectGroup.notExists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const project = user?.projects?.find((project) => {
                return project.projectId == body.projectId;
            });

            if (project) {
                const projectGroupId = project.projectGroupIds?.find(
                    (groupId) => {
                        return groupId == body.projectGroupId;
                    },
                );
                // if assign user to group, check projectGroupIds of user includes groupIds
                if (
                    projectGroupId &&
                    body.action === UpdateProjectGroupAction.ASSIGN_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.projectGroup.exists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectId',
                            message,
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        },
                    ]);
                }
                // if remove user from group, check projectGroupIds of user includes groupIds
                if (
                    !projectGroupId &&
                    body.action === UpdateProjectGroupAction.REMOVE_USER
                ) {
                    const message = await this.i18n.translate(
                        'user.update.projectGroup.notExists',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'projectId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            const isChangeProfile =
                await this.userService.checkChangeProjectProfile(
                    id,
                    body.projectId,
                    body.projectGroupId,
                );

            if (!isChangeProfile || body.isConfirm) {
                const updatedUser =
                    await this.userService.updateProjectGroupIdsUser(id, {
                        ...body,
                        updatedBy: req?.loginUser?._id,
                    });

                this.auditLogService.createAuditLog({
                    module: AuditLogModules.USER,
                    action: AuditLogActions.UPDATE,
                    targetObjectId: updatedUser._id,
                    description: '',
                    createdBy: new ObjectId(req?.loginUser?._id),
                });

                this.projectLogService.createProjectLog({
                    module: ProjectLogModules.USER,
                    action: ProjectLogActions.UPDATE_USER,
                    newData: updatedUser as unknown as Record<string, unknown>,
                    oldData: user as unknown as Record<string, unknown>,
                    projectId: new ObjectId(body.projectId),
                    description: '',
                    createdBy: new ObjectId(req?.loginUser?._id),
                });

                return new SuccessResponse({
                    updatedUser,
                });
            }

            if (isChangeProfile) {
                return new SuccessResponse({
                    isChangeProfile: isChangeProfile,
                });
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    async deleteUser(@Req() req, @Param('id', ParseObjectIdPipe) id: ObjectId) {
        try {
            const user = await this.userService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate('user.get.wrong.id');
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            if (req?.loginUser?._id.toString() === id.toString()) {
                const message = await this.i18n.translate(
                    'user.delete.deleteYourself',
                );
                return new ErrorResponse(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    message,
                    [],
                );
            }

            await Promise.all([
                this.userService.deleteUser(id, req?.loginUser?._id),
                this.notificationService.removeNotificationsByUser(
                    id,
                    req?.loginUser?._id,
                ),
                this.projectService.unassignProjectAdmin(id),
            ]);
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.DELETE,
                targetObjectId: id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse({ id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/set-password')
    async setPassword(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(setPasswordFormSchema))
        body: ISetPasswordBody,
    ) {
        try {
            const user = await this.userService.getUserById(id, true);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.errors.userNotFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }

            if (body.assignRandomPassword) {
                body.password = randomstring.generate({
                    length: RESET_PASSWORD_LENGTH,
                    type: 'alphanumeric',
                });
            }
            const updateData = {
                password: hashPassword(body.password),
            };
            if (body.needToChangePassword) {
                Object.assign(updateData, {
                    ...updateData,
                    needToChangePassword: true,
                });
            }
            await this.userService.updateUser(id, updateData);
            await this.notificationService.approveNotification(
                new ObjectId(id),
                new ObjectId(req.loginUser?._id),
            );
            const message = {
                to: user.email,
                from: this.configService.get(ConfigKey.SENDGRID_SENDER),
                templateId: '',
                dynamicTemplateData: {},
            };

            if (body.assignRandomPassword) {
                const activationKey = randomstring.generate({
                    length: ACCOUNT_ACTIVATION_KEY_LENGTH,
                    type: 'alphanumeric',
                });

                const activationUrl = `${this.configService.get(
                    ConfigKey.WEB_APP_BASE_URL,
                )}/active-user/${activationKey}`;

                await Promise.all([
                    this.userService.deactivateUser(id),
                    this.userService.createUserToken({
                        type: UserTokenTypes.ACTIVE_USER,
                        token: activationKey,
                        createdBy: req?.loginUser?._id,
                        hashToken: this.authService.generateHashToken(user._id),
                        userId: id,
                        deletedAt: moment()
                            .add(activeAccountKeyExpiredIn, 'hour')
                            .toDate(),
                    }),
                ]);

                Object.assign(message, {
                    ...message,
                    templateId: this.configService.get(
                        ConfigKey.SENDGRID_TEMPLATE_ID_NEW_PASSWORD_WITH_ACTIVATION_LINK,
                    ),
                    dynamicTemplateData: {
                        password: body.password,
                        fullName: `${user.firstName} ${user.lastName}`,
                        activationUrl,
                    },
                });
            } else {
                Object.assign(message, {
                    ...message,
                    templateId: this.configService.get(
                        ConfigKey.SENDGRID_TEMPLATE_ID_NEW_PASSWORD,
                    ),
                    dynamicTemplateData: {
                        password: body.password,
                        fullName: `${user.firstName} ${user.lastName}`,
                    },
                });
                await this.userService.activeUser(id, req.loginUser?._id);
            }

            const response = await this.sendGridService.sendMail(message);
            if (response[0].statusCode === SENDGRID_SEND_MAIL_SUCCESS_CODE) {
                return new SuccessResponse(response[0][0]?.body);
            } else {
                const message = await this.i18n.translate(
                    'user.contact.error.sendMail',
                );
                return new ErrorResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    message,
                    [],
                );
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/reset-password')
    async resetPassword(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(resetPasswordFormSchema))
        body: IResetPasswordBody,
    ) {
        try {
            const user = await this.userService.getUserById(id, true);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.errors.userNotFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (
                !this.userService.hasPermissionToManage(
                    req?.loginUser?.accessModules,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.translate(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            if (body.assignRandomPassword) {
                body.password = randomstring.generate({
                    length: RESET_PASSWORD_LENGTH,
                    type: 'alphanumeric',
                });
            }
            const updateData = {
                newPasswordWaitingActice: hashPassword(body.password),
            };
            if (body.needToChangePassword) {
                Object.assign(updateData, {
                    ...updateData,
                    needToChangePassword: true,
                });
            }
            await Promise.all([
                this.userService.updateUser(id, updateData),
                this.notificationService.approveNotification(
                    new ObjectId(body.notificationId),
                    new ObjectId(req.loginUser?._id),
                ),
            ]);
            const message = {
                to: user.email,
                from: this.configService.get(ConfigKey.SENDGRID_SENDER),
                templateId: '',
                dynamicTemplateData: {},
            };

            if (body.assignRandomPassword) {
                const activationKey = randomstring.generate({
                    length: ACCOUNT_ACTIVATION_KEY_LENGTH,
                    type: 'alphanumeric',
                });

                const activationUrl = `${this.configService.get(
                    ConfigKey.WEB_APP_BASE_URL,
                )}/active-new-password/${activationKey}`;

                await Promise.all([
                    this.userService.createUserToken({
                        type: UserTokenTypes.ACTIVE_USER,
                        token: activationKey,
                        createdBy: req?.loginUser?._id,
                        hashToken: this.authService.generateHashToken(user._id),
                        userId: id,
                    }),
                ]);

                Object.assign(message, {
                    ...message,
                    templateId: this.configService.get(
                        ConfigKey.SENDGRID_TEMPLATE_ID_RESET_PASSWORD,
                    ),
                    dynamicTemplateData: {
                        password: body.password,
                        fullName: `${user.firstName} ${user.lastName}`,
                        activationUrl,
                    },
                });
            } else {
                Object.assign(message, {
                    ...message,
                    templateId: this.configService.get(
                        ConfigKey.SENDGRID_TEMPLATE_ID_NEW_PASSWORD,
                    ),
                    dynamicTemplateData: {
                        password: body.password,
                        fullName: `${user.firstName} ${user.lastName}`,
                    },
                });
                await this.userService.activeNewPassword(id);
            }

            const response = await this.sendGridService.sendMail(message);
            if (response[0].statusCode === SENDGRID_SEND_MAIL_SUCCESS_CODE) {
                return new SuccessResponse(response[0][0]?.body);
            } else {
                const message = await this.i18n.translate(
                    'user.contact.error.sendMail',
                );
                return new ErrorResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    message,
                    [],
                );
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/contact')
    async contactUser(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(contactUserSchema))
        body: IContact,
    ) {
        const message = {
            to: body.email,
            from: this.configService.get(ConfigKey.SENDGRID_SENDER),
            templateId: this.configService.get(
                ConfigKey.SENDGRID_TEMPLATE_ID_CONTACT_USER,
            ),
            dynamicTemplateData: {
                subject: body.subject,
                text: body.description,
                fullName: body.fullName,
            },
        };
        const response = await this.sendGridService.sendMail(message);

        if (response[0].statusCode === SENDGRID_SEND_MAIL_SUCCESS_CODE) {
            return new SuccessResponse(response[0][0]?.body);
        } else {
            const message = await this.i18n.translate(
                'user.contact.error.sendMail',
            );
            return new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                message,
                [],
            );
        }
    }

    @Post('bulk-create')
    async importUsers(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(ImportUserSchema))
        body: IBulkCreateUserBody,
    ) {
        try {
            if (body.projectId) {
                const project = await this.userService.checkProjectIdsExists(
                    body?.projectId,
                );
                if (!project) {
                    const message = await this.i18n.t(
                        'user.import.project.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'project',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            }

            const emails = await this.importUserService.getUserEmails(
                uniq(body.users.map((importUser) => importUser.email)),
            );

            const countries = await this.importUserService.getUserCountries(
                uniq(body.users.map((importUser) => importUser.country)),
            );

            let groupsNames = [];
            body.users.forEach((importUser) => {
                groupsNames = groupsNames.concat(importUser.groups);
            });
            let projectGroups: ProjectGroupDocument[] = [];
            let groups: GroupDocument[] = [];
            if (
                body.projectId &&
                body.accessModule === AccessModules.SPACIALYTIC_CONSTELLATION
            ) {
                projectGroups =
                    await this.importUserService.getUserProjectGroups(
                        uniq(groupsNames),
                        body.accessModule,
                        body.projectId,
                    );
            } else {
                groups = await this.importUserService.getUserGroups(
                    uniq(groupsNames),
                    body.accessModule,
                );
            }

            let securityProfileNames = [];
            body.users.forEach((importUser) => {
                securityProfileNames = securityProfileNames.concat(
                    importUser.securityProfiles,
                );
            });
            const securityProfiles =
                await this.importUserService.getUserSecurityProfiles(
                    uniq(securityProfileNames),
                );

            let viewer3dProfileNames = [];
            body.users.forEach((importUser) => {
                viewer3dProfileNames = viewer3dProfileNames.concat(
                    importUser.viewer3dProfiles,
                );
            });
            const viewer3dProfiles =
                await this.importUserService.getUserViewer3dProfiles(
                    uniq(viewer3dProfileNames),
                );

            let projectProfileNames = [];
            body.users.forEach((importUser) => {
                projectProfileNames = projectProfileNames.concat(
                    importUser.projectProfiles,
                );
            });
            const projectProfiles =
                await this.importUserService.getUserProjectProfiles(
                    uniq(projectProfileNames),
                );

            const validationResults = await Promise.all(
                body.users.map((user) =>
                    this.importUserService.validateImportUser(
                        user,
                        emails,
                        countries,
                        groups,
                        projectGroups,
                        securityProfiles,
                        viewer3dProfiles,
                        projectProfiles,
                        body.accessModule,
                        body.projectId,
                    ),
                ),
            );

            let importAssetResults;
            validationResults.forEach((validationResult) => {
                importAssetResults = {
                    ...importAssetResults,
                    [validationResult.index]: validationResult.validationResult,
                };
            });

            if (
                !validationResults.some(
                    (validationResult) =>
                        !validationResult.validationResult.isValid,
                )
            ) {
                body.users.forEach((user) => {
                    const password = randomstring.generate({
                        length: RESET_PASSWORD_LENGTH,
                        type: 'alphanumeric',
                    });
                    const message = {
                        to: user.email,
                        from: this.configService.get(ConfigKey.SENDGRID_SENDER),
                        templateId: this.configService.get(
                            ConfigKey.SENDGRID_TEMPLATE_ID_NEW_PASSWORD,
                        ),
                        dynamicTemplateData: {
                            password,
                            fullName: `${user.firstName} ${user.lastName}`,
                        },
                    };
                    this.sendGridService.sendMail(message);
                    user.password = password;
                });
                this.importUserService.bulkCreateUsers(
                    body.users.map((user) => {
                        return this.importUserService.mapImportUser(
                            user,
                            countries,
                            req?.loginUser?._id,
                            body.accessModule,
                            groups,
                            projectGroups,
                            securityProfiles,
                            viewer3dProfiles,
                            projectProfiles,
                            body.projectId,
                        );
                    }),
                );
            }

            return new SuccessResponse({
                results: importAssetResults,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/project')
    async getProjectListAssignedUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const user = await this.userService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.errors.userNotFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const projects =
                await this.userService.getAllProjectsAssignedToUser(user);
            return new SuccessResponse(projects);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id/project-not-assign')
    async getProjectListUserCanNotAccess(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ProjectListQueryStringSchema),
        )
        query: IGetProjectQueryString,
    ) {
        try {
            const user = await this.userService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.errors.userNotFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                !this.userService.checkUserHavePermission(
                    req.loginUser,
                    user.accessModules,
                )
            ) {
                const message = await this.i18n.t(
                    'user.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const projects =
                await this.userService.getProjectListUserCanNotAccess(
                    user,
                    query,
                );
            return new SuccessResponse(projects);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/project')
    @Permissions([SecurityPermissions.ASSIGN_USER_GROUP_TO_PROJECT])
    async updateProjectAssignedUser(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(updateUserProjectIdsSchema),
        )
        body: IUserUpdateProjectIdsBody,
    ) {
        try {
            const user = await this.userService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.errors.userNotFound',
                );
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
                    'user.update.project.notExists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'groupId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            let updateBody = user.assignedProjectIds || [];
            const projectIds = updateBody?.flatMap((item) => item.toString());

            // if assign user to group, check groupIds of user includes groupId
            if (body.action === UpdateProjectUserAction.ASSIGN_PROJECT) {
                if (projectIds?.includes(body.projectId.toString())) {
                    const message = await this.i18n.translate(
                        'user.update.project.exists',
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
            else if (body.action === UpdateProjectUserAction.REMOVE_PROJECT) {
                if (!projectIds?.includes(body.projectId.toString())) {
                    const message = await this.i18n.translate(
                        'user.update.project.notExists',
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
                }
            }

            const updatedUser = await this.userService.updateUser(id, {
                assignedProjectIds: updateBody,
                updatedBy: req?.loginUser?._id,
            });

            if (body.action === UpdateProjectUserAction.REMOVE_PROJECT) {
                if (
                    !(await this.userService.checkIfUserCanAccessProject(
                        updatedUser,
                        project._id,
                    ))
                ) {
                    this.userService.removeAllConnectionsBetweenUserAndProject(
                        updatedUser,
                        project._id,
                    );
                }
            }
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.UPDATE,
                targetObjectId: id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const country = await this.userService.getCountryById(
                user?.countryId,
            );

            this.projectLogService.createProjectLog({
                module: ProjectLogModules.USER,
                action:
                    body.action === UpdateProjectUserAction.ASSIGN_PROJECT
                        ? ProjectLogActions.ASSIGN_TO_PROJECT_USER
                        : ProjectLogActions.REMOVE_FROM_PROJECT_USER,
                newData:
                    body.action === UpdateProjectUserAction.ASSIGN_PROJECT
                        ? ({
                              ...user.toJSON(),
                              country: country.name,
                          } as unknown as Record<string, unknown>)
                        : null,
                oldData:
                    body.action === UpdateProjectUserAction.ASSIGN_PROJECT
                        ? null
                        : ({
                              ...user.toJSON(),
                              country: country?.name,
                          } as unknown as Record<string, unknown>),
                projectId: new ObjectId(body.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse({
                updatedUser,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
