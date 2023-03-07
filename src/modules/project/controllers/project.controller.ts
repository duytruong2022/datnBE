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
import {
    AccessModules,
    HttpStatus,
    SaturdayWeekDay,
    SundayWeekDay,
    UserRoles,
} from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    ICreateProject,
    IGetProjectNotification,
    IGetProjectQueryString,
    IProject,
    IProjectSettingField,
    IUpdateProjectActivityCodeStatus,
} from '../project.interface';
import {
    createProjectSchema,
    ProjectListQueryStringSchema,
    ProjectNotificationQueryStringSchema,
    setProjectFieldSettingSchema,
    updateProfileSchema,
    updateProjectActivityCodeStatusSchema,
} from '../project.validator';
import { OpenStreetMapService } from '../../common/services/open-street-map.service';
import { ProjectMongoService } from '../services/project.mongo.service';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';
import {
    AuditLogModules,
    AuditLogActions,
} from '../../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../../audit-log/services/audit-log.service';
import { ConfigService } from '@nestjs/config';
import {
    DayTypes,
    defaultDayTypeName,
    defaultProjectCalendarName,
    defaultWorkingTimes,
} from '../project.constant';
import { UserMongoService } from 'src/modules/user/services/user.mongo.service';
import { getAccessModules } from 'src/common/helpers/commonFunctions';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { GroupMongoService } from 'src/modules/group/services/group.mongo.service';
import { TaskMongoService } from '../services/task.mongo.service';
import { PlanningMongoService } from '../services/planning.mongo.service';
import { ProjectFieldSettingMongoService } from '../services/project-field-setting.mongo.service';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';
import { CalendarMongoService } from '../services/calendar.mongo.service';
import { DayTypeMongoService } from '../services/day-type.mongo.service';
import moment from 'moment-timezone';
import { CalendarConfigMongoService } from '../services/calendar-config.mongo.service';
import { ProjectLogMongoService } from 'src/modules/project-log/services/project-log.service';
import {
    ProjectLogActions,
    ProjectLogModules,
} from 'src/modules/project-log/project-log.constant';

@Controller('/project')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
export class ProjectController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly projectService: ProjectMongoService,
        private readonly openStreetMapService: OpenStreetMapService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly userService: UserMongoService,
        private readonly groupService: GroupMongoService,
        private readonly taskService: TaskMongoService,
        private readonly planningService: PlanningMongoService,
        private readonly projectFieldSettingService: ProjectFieldSettingMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
        private readonly calendarService: CalendarMongoService,
        private readonly dayTypeService: DayTypeMongoService,
        private readonly calendarConfigService: CalendarConfigMongoService,
    ) {
        //
    }

    @Get('/')
    async getProjectList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ProjectListQueryStringSchema),
        )
        query: IGetProjectQueryString,
    ) {
        try {
            const user = await this.userService.getUserById(req.loginUser._id);

            if (!user) {
                const message = await this.i18n.translate(
                    'project.errors.userNotExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }

            query.accessibleProjectIds =
                await this.userService.getAllProjectIdsUserCanAccess(user);
            if (
                query.accessibleProjectIds &&
                !query.accessibleProjectIds.length
            ) {
                return new SuccessResponse({
                    items: [],
                    totalItems: 0,
                });
            }
            const projectList = await this.projectService.getListProject(query);
            return new SuccessResponse(projectList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    async getProjectDetail(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const user = await this.userService.getUserById(req.loginUser._id);

            if (!user) {
                const message = await this.i18n.translate(
                    'project.errors.userNotExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }

            const isUserCanAccessProject =
                await this.userService.checkIfUserCanAccessProject(user, id);
            if (!isUserCanAccessProject) {
                const message = await this.i18n.translate(
                    'project.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const project = await this.projectService.getProjectById(id);
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
            return new SuccessResponse(project);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    @Permissions([SecurityPermissions.CREATE_PROJECT])
    async createProject(
        @Req() req,
        @Body(new JoiValidationPipe(createProjectSchema)) body: ICreateProject,
    ) {
        try {
            const isProjectNameDuplicated =
                await this.projectService.isProjectNameDuplicate(body.name);
            if (isProjectNameDuplicated) {
                const message = await this.i18n.translate(
                    'project.errors.duplicateName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }

            const admin = await this.projectService.getProjectAdmin(
                body.adminId,
            );
            if (!admin) {
                const message = await this.i18n.translate(
                    'project.errors.adminNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'adminId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                    },
                ]);
            }

            const coordinatesDetails =
                await this.openStreetMapService.getCoordinatesDetails({
                    latitude: body.latitude,
                    longitude: body.longitude,
                });
            body.coordinatesDetails = JSON.stringify(
                coordinatesDetails?.data?.address || {},
            );

            const calendarId = new ObjectId();
            const createdProject = await this.projectService.createProject(
                {
                    ...body,
                    displayActivityCode: true,
                    createdBy: new ObjectId(req?.loginUser?._id),
                },
                // pass calendar default for planning template
            );

            await this.userService.assignProjectToUser(
                new ObjectId(body.adminId),
                createdProject._id,
            );

            const calendar = await this.calendarService.createCalendar({
                _id: calendarId,
                name: defaultProjectCalendarName,
                projectId: createdProject._id,
                isDefaultCalendar: true,
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const dayType = await this.dayTypeService.createDayType({
                name: defaultDayTypeName,
                timeBlocks: defaultWorkingTimes,
                projectId: createdProject._id,
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const startOfThisYear = moment.tz(body.timezone).startOf('year');
            const endOfThisYear = moment.tz(body.timezone).endOf('year');
            const monthDurationInDays = endOfThisYear.diff(
                startOfThisYear,
                'day',
            );
            const dateConfig = [];
            for (let i = 0; i <= monthDurationInDays; ++i) {
                const date = startOfThisYear.clone().add(i, 'day');
                if (![SundayWeekDay, SaturdayWeekDay].includes(date.day())) {
                    dateConfig.push(date.toDate());
                }
            }

            await this.calendarConfigService.setWorkingDays(
                dateConfig,
                calendar._id,
                {
                    workingDayTypeId: dayType._id,
                    updatedBy: new ObjectId(req?.loginUser?._id),
                    dayType: DayTypes.WORKING_DAY,
                },
            );

            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT,
                action: AuditLogActions.CREATE,
                targetObjectId: createdProject._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT,
                action: ProjectLogActions.CREATE_PROJECT,
                newData: {
                    ...createdProject,
                    admin: admin.email,
                } as unknown as Record<string, unknown>,
                projectId: createdProject._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(createdProject);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    async updateProject(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(updateProfileSchema)) body: IProject,
    ) {
        try {
            const user = await this.userService.getUserById(req.loginUser._id);

            if (!user) {
                const message = await this.i18n.translate(
                    'project.errors.userNotExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }

            const isUserCanAccessProject =
                await this.userService.checkIfUserCanAccessProject(user, id);
            if (!isUserCanAccessProject) {
                const message = await this.i18n.translate(
                    'project.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const project = await this.projectService.getProjectById(id);
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

            const admin = await this.projectService.getProjectAdmin(
                body.adminId,
            );
            if (!admin) {
                const message = await this.i18n.translate(
                    'project.errors.adminNotExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'adminId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                    },
                ]);
            }
            const accessModules = getAccessModules(
                admin.accessModules,
                UserRoles.NORMAL_USER,
            ).concat(getAccessModules(admin.accessModules, UserRoles.ADMIN));
            if (
                !accessModules.includes(AccessModules.SPACIALYTIC_CONSTELLATION)
            ) {
                const message = await this.i18n.translate(
                    'project.errors.adminNotInConstellation',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'adminId',
                        errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                        message,
                    },
                ]);
            }

            const isProjectNameDuplicated =
                await this.projectService.isProjectNameDuplicate(body.name, id);
            if (isProjectNameDuplicated) {
                const message = await this.i18n.translate(
                    'project.errors.duplicateName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            if (project?.adminId?.toString() !== body.adminId.toString()) {
                await Promise.all([
                    this.userService.assignProjectToUser(
                        new ObjectId(body.adminId),
                        project._id,
                    ),

                    this.userService.unassignProjectToUser(
                        new ObjectId(project.adminId),
                        project._id,
                    ),
                ]);
                const oldAdmin = await this.userService.getUserById(
                    project.adminId,
                );
                if (project?.adminId) {
                    if (
                        !(await this.userService.checkIfUserCanAccessProject(
                            oldAdmin._id,
                            project._id,
                        ))
                    ) {
                        this.userService.removeAllConnectionsBetweenUserAndProject(
                            oldAdmin._id,
                            project._id,
                        );
                    }
                }
            }
            const updatedProject = await this.projectService.updateProject(id, {
                ...body,
                taskIdSuffix: parseInt(body.taskIdSuffix.toString()),
                taskIdIncrement: parseInt(body.taskIdIncrement.toString()),
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedProject._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            let oldAdmin;
            if (project?.adminId?.toString() === body.adminId.toString()) {
                oldAdmin = admin;
            } else {
                oldAdmin = await this.projectService.getProjectAdmin(
                    project.adminId,
                );
            }

            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT,
                action: ProjectLogActions.UPDATE_PROJECT,
                newData: {
                    ...updatedProject,
                    admin: admin.email,
                } as unknown as Record<string, unknown>,
                oldData: {
                    ...project,
                    admin: oldAdmin.email,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(id),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedProject);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    async deleteProject(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const user = await this.userService.getUserById(req.loginUser._id);

            if (!user) {
                const message = await this.i18n.translate(
                    'project.errors.userNotExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }

            const isUserCanAccessProject =
                await this.userService.checkIfUserCanAccessProject(user, id);
            if (!isUserCanAccessProject) {
                const message = await this.i18n.translate(
                    'project.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const project = await this.projectService.getProjectById(id);
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
            //TODO: check delete project requirements
            const [message] = await Promise.all([
                this.i18n.translate('project.success.delete'),
                this.projectService.deleteProject(id, req?.loginUser?._id),
                this.groupService.deleteProjectFromGroup(id),
                this.userService.deleteProjectFromUser(id),
            ]);
            this.auditLogService.createAuditLog({
                module: AuditLogModules.PROJECT,
                action: AuditLogActions.DELETE,
                targetObjectId: new ObjectId(id),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            const oldAdmin = await this.projectService.getProjectAdmin(
                project.adminId,
            );

            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT,
                action: ProjectLogActions.DELETE_PROJECT,
                oldData: {
                    ...project,
                    admin: oldAdmin.email,
                } as unknown as Record<string, unknown>,
                projectId: new ObjectId(id),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse({ _id: id }, message as string);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':projectId/dashboard')
    async getProjectDashboard(
        @Req() req,
        @Param('projectId', ParseObjectIdPipe) projectId: ObjectId,
    ) {
        try {
            const user = await this.userService.getUserById(req.loginUser._id);
            if (!user) {
                const message = await this.i18n.translate(
                    'project.errors.userNotExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }
            const isUserCanAccessProject =
                await this.userService.checkIfUserCanAccessProject(
                    user,
                    projectId,
                );
            if (!isUserCanAccessProject) {
                const message = await this.i18n.translate(
                    'project.errors.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const project = await this.projectService.getProjectById(projectId);
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
            const [
                assignedUserCount,
                // planningCount,
                // file3DCount,
                taskCount,
                linkCount,
                countTaskGroupByStatus,
                companyCount,
                // assignedResourceCount,
                // allResourceCount,
                // assignedResourceWith3DObjectCount,
                userProjectFieldSetting,
            ] = await Promise.all([
                this.userService.countAssignedUserToProject(projectId),
                // this.projectFileService.counProjectFileByExtensions(
                //     projectId,
                //     planningExtensionList,
                // ),
                // this.projectFileService.counProjectFileByExtensions(
                //     projectId,
                //     viewer3DExtensionList,
                // ),
                this.taskService.countAllTaskInProject(projectId),
                this.planningService.countAllLinksInProject(projectId),
                this.taskService.countTaskGroupByStatus(projectId),
                this.userService.countAssignedCompanyToProject(projectId),
                // this.resourceService.countAssignedResourceGroupByType(
                //     projectId,
                // ),
                // this.resourceService.countAllResourceGroupByType(projectId),
                // this.resourceService.countAssigedResourceWith3DObjectGroupByType(
                //     projectId,
                // ),
                this.projectFieldSettingService.getUserProjectFieldSetting(
                    new ObjectId(req.loginUser?._id),
                    project._id,
                ),
            ]);
            return new SuccessResponse({
                assignedUserCount,
                // planningCount,
                // file3DCount,
                taskCount,
                linkCount,
                countTaskGroupByStatus,
                companyCount,
                // assignedResourceCount,
                // allResourceCount,
                // assignedResourceWith3DObjectCount,
                userProjectFieldSetting,
                project,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':projectId/field-setting')
    async getUserProjectFieldSetting(
        @Req() req,
        @Param('projectId', ParseObjectIdPipe) projectId: ObjectId,
    ) {
        try {
            const project = await this.projectService.getProjectById(projectId);
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
            const projectFieldSetting =
                await this.projectFieldSettingService.getUserProjectFieldSetting(
                    new ObjectId(req.loginUser?._id),
                    project._id,
                );
            return new SuccessResponse(projectFieldSetting);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':projectId/field-setting')
    async setUserProjectFieldSetting(
        @Req() req,
        @Param('projectId', ParseObjectIdPipe) projectId: ObjectId,
        @Body(new JoiValidationPipe(setProjectFieldSettingSchema))
        body: IProjectSettingField,
    ) {
        try {
            const project = await this.projectService.getProjectById(projectId);
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
            const updatedSetting =
                await this.projectFieldSettingService.updateOrCreateProjectFieldSetting(
                    {
                        userId: new ObjectId(req.loginUser?._id),
                        projectId: project._id,
                        settings: body,
                    },
                );
            return new SuccessResponse(updatedSetting);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id/activity-code-status')
    async updateActivityCodeStatus(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
        @Body(new JoiValidationPipe(updateProjectActivityCodeStatusSchema))
        body: IUpdateProjectActivityCodeStatus,
    ) {
        try {
            const project = await this.projectService.getProjectById(id);
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

            body.updatedBy = new ObjectId(req.loginUser._id);
            const updatedProject =
                await this.projectService.updateActivityCodeStatus(id, body);
            return new SuccessResponse(updatedProject);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':projectId/notification')
    async getProjectNotification(
        @Req() req,
        @Param('projectId', new ParseObjectIdPipe()) projectId: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ProjectNotificationQueryStringSchema),
        )
        query: IGetProjectNotification,
    ) {
        try {
            const project = await this.projectService.getProjectById(projectId);
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

            const data =
                await this.projectNotificationService.getProjectNotificationList(
                    { ...query, projectId },
                );
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
