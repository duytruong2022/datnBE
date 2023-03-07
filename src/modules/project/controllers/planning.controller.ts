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
import { HttpStatus } from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    ICreateLinkBody,
    ICreatePlanningBody,
    IPlanningListQuery,
    IUpdateLinkBody,
    ICreateAdditionalTaskFieldBody,
    IPlanningByPathNameQuery,
    IUpdatePlanning,
    IUpdateAdditionalTaskFieldBody,
    IGetUserDefineFiledQueryString,
    IProjectGetListQuery,
    IUpdateOriginalPlanning,
    IBulkCreateLinkBody,
} from '../project.interface';
import {
    CreateLinkSchema,
    UpdateLinkSchema,
    CreatePlanningSchema,
    PlanningListQueryStringSchema,
    UpdatePlanningSchema,
    CreateAdditionalTaskFieldsSchema,
    UpdateAdditionalTaskFieldsSchema,
    planningByPathNameQueryString,
    UserDefileFieldQueryStringSchema,
    ProjectGetListQuerySchema,
    UpdateOriginalPlanningSchema,
    BulkCreateLinkSchema,
} from '../project.validator';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { PlanningMongoService } from '../services/planning.mongo.service';
import { ObjectId } from 'mongodb';
import {
    ProjectNotificationType,
    TaskFieldDataType,
} from '../project.constant';
import { ProjectMongoService } from '../services/project.mongo.service';
import { ConfigService } from '@nestjs/config';
import { TaskMongoService } from '../services/task.mongo.service';
import { LinkMongoService } from '../services/link.mongo.service';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { BaselinePlanningMongoService } from '../services/baseline-planning.mongo.service';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';
import { CalendarMongoService } from '../services/calendar.mongo.service';
import { CalendarDocument } from '../mongo-schemas/calendar.schema';
@Controller('/planning')
@UseGuards(AuthenticationGuard)
export class PlanningController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly planningService: PlanningMongoService,
        private readonly linkService: LinkMongoService,
        private readonly taskService: TaskMongoService,
        private readonly configService: ConfigService,
        private readonly projectService: ProjectMongoService,
        private readonly baselinePlanningService: BaselinePlanningMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
        private readonly calendarService: CalendarMongoService,
    ) {
        //
    }

    @Get('planning-by-path-name')
    @UseGuards(AuthenticationGuard)
    async getPlanningByPathAndName(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(planningByPathNameQueryString),
        )
        query: IPlanningByPathNameQuery,
    ) {
        try {
            const planning =
                await this.planningService.getPlanningByPathAndName(query);

            return new SuccessResponse(planning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:planningId/original-planning')
    async updateMilestoneIMAndFLInOriginalPlanning(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Body(new JoiValidationPipe(UpdateOriginalPlanningSchema))
        body: IUpdateOriginalPlanning,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
            );
            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const originalPlanningId = new ObjectId(body.tasks[0].planningId);
            const checkOriginalPlanning =
                await this.planningService.checkOriginalPlanning(
                    originalPlanningId,
                    [planningId],
                );

            if (!checkOriginalPlanning) {
                const message = await this.i18n.translate(
                    'project-planning.invalid.task.notOriginalPlanning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'tasks',
                        errorCode: HttpStatus.ITEM_INVALID,
                        message,
                    },
                ]);
            }

            const taskDelegateIds = body.tasks.map((task) => {
                return task._id;
            });
            const milestoneIds = body.milestones?.map((milestone) => {
                return milestone._id;
            });
            const isTasksExist = await this.taskService.checkAllTaskIdsExist([
                ...taskDelegateIds,
                ...milestoneIds,
            ]);
            if (!isTasksExist) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.taskIds',
                );
                return new ErrorResponse(HttpStatus.NOT_FOUND, message, []);
            }

            const message = await this.i18n.t(
                'project-planning.message.updateOriginalPlanning',
            );
            return new SuccessResponse({}, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:projectId/list')
    async getPlanningList(
        @Param('projectId', new ParseObjectIdPipe()) projectId: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(PlanningListQueryStringSchema),
        )
        query: IPlanningListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                projectId,
                ['_id', 'name'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'abs.error.project.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const planningList = await this.planningService.getPlanningList(
                projectId,
                query,
            );

            return new SuccessResponse(planningList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getPlanning(@Param('id', new ParseObjectIdPipe()) id: ObjectId) {
        try {
            const planning =
                await this.planningService.getPlanningByNameAndPath(
                    new ObjectId(id),
                );
            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const calendarIds = [];
            planning.tasks.forEach((task) => {
                if (task.calendarId) {
                    calendarIds.push(task.calendarId);
                }
            });
            if (calendarIds?.length) {
                const calendars = await this.calendarService.getCalendarByIds(
                    calendarIds,
                );
                const mapIdToCalendar = new Map<string, CalendarDocument>();
                calendars.forEach((calendar) =>
                    mapIdToCalendar.set(calendar._id.toString(), calendar),
                );
                planning.tasks.forEach((task, index) => {
                    if (task.calendarId) {
                        const calendar = mapIdToCalendar.get(
                            task.calendarId.toString(),
                        );
                        if (calendar) {
                            planning.tasks[index].calendarName = calendar.name;
                        }
                    }
                });
            }

            return new SuccessResponse({
                ...planning,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:planningId/planning-info')
    async getPlanningInfo(
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ProjectGetListQuerySchema),
        )
        query: IProjectGetListQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
            );
            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }
            return new SuccessResponse(planning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:planningId/task-field/:fieldId')
    async getTaskField(
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Param('fieldId', new ParseObjectIdPipe()) fieldId: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(UserDefileFieldQueryStringSchema),
        )
        query: IGetUserDefineFiledQueryString, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const taskField = await this.planningService.getTaskFieldById(
                planningId,
                fieldId,
            );

            if (!taskField) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.taskField',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }

            return new SuccessResponse(taskField);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    isTaskFieldValueValid(
        dataType: TaskFieldDataType,
        value: string | number | Date | boolean,
    ) {
        let result = false;
        switch (dataType) {
            case TaskFieldDataType.BOOLEAN: {
                if (typeof value === 'boolean') {
                    result = true;
                }
                break;
            }
            case TaskFieldDataType.STRING: {
                if (typeof value === 'string') {
                    result = true;
                }
                break;
            }
            case TaskFieldDataType.DATE_TIME: {
                if (
                    typeof value === 'string' &&
                    !isNaN(Date.parse(value as string))
                ) {
                    result = true;
                } else {
                    value = new Date(value as string).toISOString();
                }
                break;
            }
            case TaskFieldDataType.NUMBER: {
                if (typeof value === 'number') {
                    result = true;
                }
                break;
            }
            default:
                break;
        }

        return result;
    }
    @Post('/:planningId/task-field')
    async createAdditionalTaskField(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(CreateAdditionalTaskFieldsSchema),
        )
        body: ICreateAdditionalTaskFieldBody,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const fieldNameExists =
                await this.planningService.checkTaskFieldNameExists(
                    planningId,
                    body.name,
                );

            if (fieldNameExists) {
                const message = await this.i18n.translate(
                    'project-planning.exists.taskFieldName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'name',
                        message,
                    },
                ]);
            }

            const createdField = await this.planningService.addCustomTaskField(
                planningId,
                body,
            );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.CREATE_TASK_FIELD,
                createdBy: new ObjectId(req.loginUser?._id),
            });

            return new SuccessResponse({ ...createdField });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':planningId/:taskId/link')
    async getLinkListByTaskId(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Param('taskId', new ParseObjectIdPipe()) taskId: ObjectId,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const task = await this.taskService.getTaskById(taskId);
            if (!task) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.task',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const linkList = await this.linkService.getLinkListByTaskId(
                planningId,
                taskId,
            );
            return new SuccessResponse(linkList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':planningId/link')
    async createLink(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(CreateLinkSchema))
        body: ICreateLinkBody,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            body.createdBy = new ObjectId(req.loginUser?._id);

            const linkExists = await this.linkService.checkLinkExists(
                planningId,
                new ObjectId(body.source),
                new ObjectId(body.target),
                body.type,
            );

            if (linkExists) {
                const message = await this.i18n.t(
                    'project-planning.exists.link',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'source, target',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }

            const source = await this.taskService.getTaskById(
                new ObjectId(body.source),
            );
            if (!source) {
                const message = await this.i18n.t(
                    'project-planning.notExists.source',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'source',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }
            const target = await this.taskService.getTaskById(
                new ObjectId(body.target),
            );
            if (!target) {
                const message = await this.i18n.t(
                    'project-planning.notExists.target',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'target',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const isValidSourceTarget =
                await this.linkService.checkSourceTargetValid(
                    new ObjectId(body.source),
                    new ObjectId(body.target),
                );

            if (!isValidSourceTarget) {
                const message = await this.i18n.t(
                    'project-planning.notExists.sourceTarget',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'source, target',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const createdLink = await this.linkService.createLink(
                planningId,
                body,
            );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.CREATE_LINK,
                createdBy: new ObjectId(req.loginUser?._id),
            });

            return new SuccessResponse({
                link: createdLink,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':planningId/link/bulk-create')
    async bulkCreateLink(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(BulkCreateLinkSchema))
        body: IBulkCreateLinkBody,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            body.createdBy = new ObjectId(req.loginUser?._id);

            const newLinks = await this.linkService.bulkCreateLink(
                planningId,
                body.items,
            );
            return new SuccessResponse([...newLinks]);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/:_id')
    async createPlanning(
        @Param('_id', new ParseObjectIdPipe()) projectId: ObjectId,
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(CreatePlanningSchema))
        body: ICreatePlanningBody,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                projectId,
                ['_id', 'name'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'abs.error.project.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            body.createdBy = new ObjectId(req.loginUser?._id);

            // check name is unique by path
            const isNameUnique =
                await this.planningService.isNameUniqueInProject(projectId, {
                    name: body.name,
                });

            if (!isNameUnique) {
                const message = await this.i18n.translate(
                    'project-planning.exists.planningName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }

            const createdPlanning = await this.planningService.createPlanning(
                projectId,
                project.name,
                body,
            );
            return new SuccessResponse(createdPlanning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':planningId/link/:id')
    async updateLink(
        @Req() req,
        @Param('id', ParseObjectIdPipe) _id: ObjectId,
        @Param('planningId', ParseObjectIdPipe) planningId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(UpdateLinkSchema))
        body: IUpdateLinkBody,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            body.updatedBy = new ObjectId(req.loginUser?._id);
            const linkExists = await this.linkService.getLinkById(_id);

            if (!linkExists) {
                const message = await this.i18n.t(
                    'project-planning.notExists.linkId',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }

            const isValidSourceTarget =
                await this.linkService.checkSourceTargetValid(
                    new ObjectId(body.source),
                    new ObjectId(body.target),
                );

            if (!isValidSourceTarget) {
                const message = await this.i18n.t(
                    'project-planning.notExists.sourceTarget',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'source, target',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const updatedDocument = await this.linkService.updateLink(
                planningId,
                _id,
                body,
            );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.UPDATE_LINK,
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse({ ...updatedDocument.taskLinks?.[0] });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:planningId/task-field/:fieldId')
    async updateAdditionalTaskField(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Param('fieldId', new ParseObjectIdPipe()) fieldId: ObjectId,
        @Body(
            new TrimBodyPipe(),
            new JoiValidationPipe(UpdateAdditionalTaskFieldsSchema),
        )
        body: IUpdateAdditionalTaskFieldBody,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const existField = await this.planningService.getTaskFieldById(
                planningId,
                fieldId,
            );

            if (!existField) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.taskField',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'name',
                        message,
                    },
                ]);
            }

            if (existField.name === body.name) {
                return new SuccessResponse(
                    await this.planningService.getTaskFieldById(
                        planningId,
                        fieldId,
                    ),
                );
            }

            const fieldNameExists =
                await this.planningService.checkTaskFieldNameExists(
                    planningId,
                    body.name,
                );

            if (fieldNameExists) {
                const message = await this.i18n.translate(
                    'project-planning.exists.taskFieldName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'name',
                        message,
                    },
                ]);
            }

            const updatedField =
                await this.planningService.updateCustomTaskField(
                    planningId,
                    fieldId,
                    {
                        oldName: existField.name,
                        newName: body.name,
                    },
                );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.UPDATE_TASK_FIELD,
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse({ ...updatedField });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    async updatePlanning(
        @Req() req,
        @Param('id', ParseObjectIdPipe) planningId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(UpdatePlanningSchema))
        body: IUpdatePlanning,
    ) {
        try {
            body.updatedBy = req.loginUser?._id;
            const planning = await this.planningService.getPlanningById(
                planningId,
                [
                    '_id',
                    'planningId',
                    'name',
                    'planningFilePath',
                    'projectId',
                    'isTemplate',
                    'projectStart',
                    'dataDate',
                    'status',
                ],
            );
            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            if (
                planning.isTemplate &&
                body.name &&
                body.name !== planning.name
            ) {
                const message = await this.i18n.translate(
                    'project-planning.invalid.templateName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.FORBIDDEN,
                        message,
                    },
                ]);
            }

            // check name is unique by path
            const isNameUnique =
                await this.planningService.isNameUniqueInProject(
                    planning.projectId,
                    {
                        name: body.name,
                        _id: planning._id,
                    },
                );
            if (!isNameUnique) {
                const message = await this.i18n.translate(
                    'project-planning.exists.planningName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }

            const updatedPlanning = await this.planningService.updatePlanning(
                planningId,
                body,
            );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.UPDATE_PLANNING,
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse(updatedPlanning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:planningId/task-field/:fieldId')
    async deleteAdditionalTaskField(
        @Req() req,
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Param('fieldId', new ParseObjectIdPipe()) fieldId: ObjectId,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const fieldExists = await this.planningService.getTaskFieldById(
                planningId,
                fieldId,
            );

            if (!fieldExists) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.taskField',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'name',
                        message,
                    },
                ]);
            }

            await this.planningService.deleteCustomTaskFieldName(
                planningId,
                fieldId,
                fieldExists.name,
            );
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.DELETE_TASK_FIELD,
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse({ _id: fieldId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:planningId')
    async deletePlanning(
        @Req() req,
        @Param('planningId', ParseObjectIdPipe) planningId: ObjectId,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'planningFilePath', 'projectId', 'name'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            // do not allow update template planning
            if (planning.isTemplate) {
                const message = await this.i18n.translate(
                    'project-planning.template',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message);
            }

            await this.planningService.deletePlanning(planningId, {
                planningName: planning.name,
                deletedBy: new ObjectId(req.loginUser._id),
                projectId: planning.projectId,
            });
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.DELETE_PLANNING,
                createdBy: new ObjectId(req.loginUser?._id),
            });

            return new SuccessResponse({ _id: planningId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':planningId/link/:id')
    async deleteLink(
        @Req() req,
        @Param('id', ParseObjectIdPipe) _id: ObjectId,
        @Param('planningId', ParseObjectIdPipe) planningId: ObjectId,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'name', 'planningFilePath', 'projectId'],
            );

            if (!planning) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const link = await this.linkService.getLinkById(_id);

            if (!link) {
                const message = await this.i18n.t(
                    'project-planning.notExists.linkId',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            if (link.taskLinks?.[0]?.clonedFromLinkId) {
                await Promise.all([
                    this.linkService.deleteLinkAndRelatedMilestonesById(
                        planningId,
                        _id,
                        req.loginUser._id,
                    ),
                    this.planningService.addDeletedLinkIdsTopdownAndBottomup(
                        planningId,
                        link.taskLinks?.[0]?.clonedFromLinkId,
                    ),
                ]);
            }

            await this.linkService.deleteLinkById(planningId, _id);

            let deletedMilestoneIds = [];
            if (link.taskLinks?.[0]?.target) {
                const deletedMilestones =
                    await this.taskService.getTaskByLinkedTaskId(
                        link.taskLinks[0].target,
                    );
                await this.taskService.deleteTaskByLinkedTaskId(
                    link.taskLinks[0].target,
                    req?.loginUser?._id,
                );
                deletedMilestoneIds = deletedMilestones.map(
                    (milestone) => milestone._id,
                );
            }
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                projectId: planning.projectId,
                type: ProjectNotificationType.DELETE_LINK,
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse({ _id, deletedMilestoneIds });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
