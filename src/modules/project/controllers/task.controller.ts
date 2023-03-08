import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import {
    ICreateTaskBody,
    IUpdateTaskBody,
    IBulkUpdateTaskBody,
    IRenameTaskBody,
} from '../project.interface';
import {
    CreateTaskSchema,
    UpdateTaskSchema,
    BulkUpdateTaskSchema,
    RenameTaskSchema,
} from '../project.validator';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { PlanningMongoService } from '../services/planning.mongo.service';
import { ObjectId } from 'mongodb';
import {
    planningAttributes,
    ProjectNotificationType,
    TaskType,
    TASK_MAX_CHILDREN,
} from '../project.constant';
import { TaskMongoService } from '../services/task.mongo.service';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';
import { CalendarMongoService } from '../services/calendar.mongo.service';
import { UserMongoService } from 'src/modules/user/services/user.mongo.service';
import { ProjectMongoService } from '../services/project.mongo.service';
@Controller('/planning')
@UseGuards(AuthenticationGuard)
export class TaskController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly planningService: PlanningMongoService,
        private readonly taskService: TaskMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
        private readonly calendarService: CalendarMongoService,
        private readonly userService: UserMongoService,
        private readonly projectService: ProjectMongoService,
    ) {
        //
    }

    @Get('/task/:taskId')
    async getTask(@Param('taskId', new ParseObjectIdPipe()) taskId: ObjectId) {
        try {
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
            return new SuccessResponse(task);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:planningId/task-by-permission-create-child')
    async getRootTaskHasPermissionCreateChild(
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
    ) {
        try {
            const planning = await this.planningService.getPlanningById(
                planningId,
                [...planningAttributes, 'delegatedFromPlanningId'],
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

            const tasks =
                await this.taskService.getRootTaskHasPermissionCreateChild(
                    planning,
                );
            return new SuccessResponse(tasks);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/:planningId/task')
    async createTask(
        @Param('planningId', new ParseObjectIdPipe()) planningId: ObjectId,
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(CreateTaskSchema))
        body: ICreateTaskBody,
    ) {
        try {
            body.createdBy = req.loginUser?._id;
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['_id', 'projectId', 'name', 'dataDate'],
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

            if (body.parentId) {
                const parent = await this.taskService.getTaskById(
                    new ObjectId(body.parentId),
                );
                if (!parent) {
                    const message = await this.i18n.t(
                        'project-planning.notExists.parentId',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            key: 'parentId',
                        },
                    ]);
                }
                if (parent.clonedFromTaskId) {
                    body.clonedFromTaskId = parent.clonedFromTaskId;
                }
                if (
                    [
                        TaskType.FINISH_MILESTONE,
                        TaskType.START_MILESTONE,
                    ].includes(parent.taskType)
                ) {
                    const message = await this.i18n.t(
                        'project-planning.invalid.parent.milestone',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            key: 'parentId',
                        },
                    ]);
                }
                if (
                    parent.isMilestoneFolder &&
                    ![
                        TaskType.FINISH_MILESTONE,
                        TaskType.START_MILESTONE,
                    ].includes(body.taskType)
                ) {
                    const message = await this.i18n.t(
                        'project-planning.invalid.task.milestoneType',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            key: 'taskType',
                        },
                    ]);
                }
            }

            // TODO check max level of element

            // check limit of children with parentId
            const numOfSiblings =
                await this.taskService.getNumberOfTaskSiblings(new ObjectId());
            if (numOfSiblings > TASK_MAX_CHILDREN) {
                const message = await this.i18n.t(
                    'project-planning.exceed.children',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        message,
                        errorCode: HttpStatus.EXCEED_LIMIT,
                        key: 'parentId',
                    },
                ]);
            }

            let calendarName = '';
            if (body.calendarId) {
                const calendar = await this.calendarService.getCalendarById(
                    body.calendarId,
                );
                if (!calendar) {
                    const message = await this.i18n.translate(
                        'calendar.error.notExist',
                    );
                    return new ErrorResponse(
                        HttpStatus.ITEM_NOT_FOUND,
                        message,
                        [],
                    );
                }
                body.calendarId = calendar._id;
                calendarName = calendar.name;
            } else {
                const defaultCalendar =
                    await this.calendarService.getProjectDefaultCalendar(
                        planning.projectId,
                    );
                if (defaultCalendar) {
                    body.calendarId = defaultCalendar._id;
                    calendarName = defaultCalendar.name;
                }
            }

            const createdTask = await this.taskService.createTask({
                ...body,
                planningId: planningId,
            });
            await this.calendarService.updateTaskCalendar(createdTask._id);
            this.projectNotificationService.createProjectNotification({
                target: `${planning.name}.planning`,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: planning.projectId,
                type: ProjectNotificationType.CREATE_TASK,
            });

            return new SuccessResponse({
                ...createdTask,
                calendarName,
            });
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Patch('/task/bulk-update')
    async batchUpdateTask(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(BulkUpdateTaskSchema))
        body: IBulkUpdateTaskBody,
    ) {
        try {
            const taskIds = body.items.map((task) => {
                return new ObjectId(task.taskId);
            });
            const checkAllTaskIdsExistInProject =
                this.taskService.checkAllTaskIdsExistInProject(
                    taskIds,
                    body.projectId,
                );

            if (!checkAllTaskIdsExistInProject) {
                const message = await this.i18n.translate(
                    'project-planning.notExists.task',
                );
                return new ErrorResponse(HttpStatus.NOT_FOUND, message, []);
            }

            const dataTasks = await this.taskService.bulkUpdateTasks(
                body.items,
            );
            return new SuccessResponse([...dataTasks]);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/task/:id')
    async updateTask(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(UpdateTaskSchema))
        body: IUpdateTaskBody,
    ) {
        try {
            body.updatedBy = req.loginUser?._id;
            const existsTask = await this.taskService.getTaskById(_id);
            if (!existsTask) {
                const message = await this.i18n.t(
                    'project-planning.notExists._id',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            if (!existsTask.canEdit) {
                delete body.ganttId;
                delete body.name;
            }

            const planningId = new ObjectId(existsTask.planningId);
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['projectId', 'dataDate'],
            );
            if (!planning) {
                const message = await this.i18n.t(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                        key: 'planningId',
                    },
                ]);
            }

            if (body.parentId) {
                const parent = await this.taskService.getTaskById(
                    new ObjectId(body.parentId),
                );
                if (!parent) {
                    const message = await this.i18n.t(
                        'project-planning.notExists.parentId',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            key: 'parentId',
                        },
                    ]);
                }
                if (
                    [
                        TaskType.FINISH_MILESTONE,
                        TaskType.START_MILESTONE,
                    ].includes(parent.taskType)
                ) {
                    const message = await this.i18n.t(
                        'project-planning.invalid.parent.milestone',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            key: 'parentId',
                        },
                    ]);
                }
                if (
                    parent.isMilestoneFolder &&
                    ![
                        TaskType.FINISH_MILESTONE,
                        TaskType.START_MILESTONE,
                    ].includes(body.taskType)
                ) {
                    const message = await this.i18n.t(
                        'project-planning.invalid.task.milestoneType',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            key: 'taskType',
                        },
                    ]);
                }
            }

            if (
                existsTask.taskType === TaskType.WBS_SUMMARY &&
                body.taskType !== TaskType.WBS_SUMMARY
            ) {
                // if this is WBS_SUMMARY type, do not allow update type if this task has at least one child
                const countChildrenTaskByIds =
                    await this.taskService.countChildrenTaskByIds([_id]);
                if (countChildrenTaskByIds > 0) {
                    const message = await this.i18n.t(
                        'project-planning.task.updateParentType',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            key: 'taskType',
                        },
                    ]);
                }
            }
            if (body.calendarId) {
                body.calendarId = new ObjectId(body.calendarId);
            } else {
                const defaultCalendar =
                    await this.calendarService.getProjectDefaultCalendar(
                        planning.projectId,
                    );
                if (defaultCalendar) {
                    body.calendarId = defaultCalendar._id;
                }
            }
            const updatedTasks = await this.taskService.updateTask(_id, body);
            if (planning) {
                this.projectNotificationService.createProjectNotification({
                    target: existsTask.name,
                    createdBy: new ObjectId(req.loginUser?._id),
                    projectId: planning.projectId,
                    type: ProjectNotificationType.CREATE_TASK,
                });
            }

            this.projectNotificationService.createProjectNotification({
                target: existsTask.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: planning.projectId,
                type: ProjectNotificationType.CREATE_TASK,
            });
            return new SuccessResponse(updatedTasks);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/task/:id')
    async deleteTask(
        @Req() req,
        @Param('id', ParseObjectIdPipe) _id: ObjectId,
    ) {
        try {
            const existsTask = await this.taskService.getTaskById(_id);

            if (!existsTask) {
                const message = await this.i18n.t(
                    'project-planning.notExists._id',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }

            // TODO check task is assigned to other resources

            const _idsDeleted = await this.taskService.deleteTask(
                existsTask.planningId,
                _id,
                new ObjectId(req.loginUser?._id),
            );
            const planningId = new ObjectId(existsTask.planningId);
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['projectId'],
            );
            if (planning) {
                this.projectNotificationService.createProjectNotification({
                    target: existsTask.name,
                    createdBy: new ObjectId(req.loginUser?._id),
                    projectId: planning.projectId,
                    type: ProjectNotificationType.DELETE_TASK,
                });
            }
            return new SuccessResponse({ _ids: [..._idsDeleted] });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/task/:id/rename')
    async renameTask(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(RenameTaskSchema))
        body: IRenameTaskBody,
    ) {
        try {
            body.updatedBy = req.loginUser?._id;
            const existsTask = await this.taskService.getTaskById(_id);
            if (!existsTask) {
                const message = await this.i18n.t(
                    'project-planning.notExists._id',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            if (!existsTask.canEdit) {
                delete body.name;
            }

            const planningId = new ObjectId(existsTask.planningId);
            const planning = await this.planningService.getPlanningById(
                planningId,
                ['projectId', 'dataDate'],
            );
            if (!planning) {
                const message = await this.i18n.t(
                    'project-planning.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                        key: 'planningId',
                    },
                ]);
            }
            const updatedTasks = await this.taskService.updateTask(_id, body);
            this.projectNotificationService.createProjectNotification({
                target: existsTask.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: planning.projectId,
                type: ProjectNotificationType.UPDATE_TASK,
            });
            return new SuccessResponse(updatedTasks);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
