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
import { ObjectId } from 'mongodb';

import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';

import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { ActivityCodeMongoService } from '../services/activity-code.mongo.service';
import {
    ActivityCodeSchema,
    ActivityCodeListQuerySchema,
    ActivityCodeValueQuerySchema,
    ActivityCodeValueSchema,
    AssignActivityCodeSchema,
} from '../project.validator';
import {
    IActivityCodeBody,
    IActivityCodeValueBody,
    IActivityCodeListQuery,
    IActivityCodeQuery,
    IAssignActivityCodeValueBody,
} from '../project.interface';
import { TaskMongoService } from '../services/task.mongo.service';
import { ProjectMongoService } from '../services/project.mongo.service';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';
import { ProjectNotificationType } from '../project.constant';

@Controller('/activity-code')
@UseGuards(AuthenticationGuard)
export class ActivityCodeController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly activityCodeService: ActivityCodeMongoService,
        private readonly taskService: TaskMongoService,
        private readonly projectService: ProjectMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
    ) {}

    @Get('/')
    async getActivityCodeList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ActivityCodeListQuerySchema),
        )
        query: IActivityCodeListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                new ObjectId(query.projectId),
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const response = await this.activityCodeService.getActivityCodeList(
                new ObjectId(query.projectId),
            );
            return new SuccessResponse(response);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getActivityCode(
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ActivityCodeValueQuerySchema),
        )
        query: IActivityCodeQuery,
    ) {
        try {
            query.projectId = new ObjectId(query.projectId);
            const project = await this.projectService.getProjectById(
                query.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const activityCode =
                await this.activityCodeService.getActivityCodeById(
                    new ObjectId(id),
                );
            return new SuccessResponse(activityCode);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/value/:id')
    async getActivityCodeValue(
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ActivityCodeValueQuerySchema),
        )
        query: IActivityCodeQuery,
    ) {
        try {
            query.projectId = new ObjectId(query.projectId);
            const project = await this.projectService.getProjectById(
                query.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const activityCodeValue =
                await this.activityCodeService.getActivityCodeValue(
                    new ObjectId(id),
                    query.projectId,
                );
            return new SuccessResponse(activityCodeValue);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/value/')
    async createActivityCodeValue(
        @Req() req,
        @Body(new JoiValidationPipe(ActivityCodeValueSchema))
        body: IActivityCodeValueBody,
    ) {
        try {
            body.projectId = new ObjectId(body.projectId);
            const project = await this.projectService.getProjectById(
                body.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const checkMaxLengthCodeName =
                this.activityCodeService.checkMaxLengthActivityCodeValueName(
                    body.name,
                    body.activityCodeId,
                );
            if (!checkMaxLengthCodeName) {
                const message = await this.i18n.translate(
                    `activity-code.post.failedDependency.activityCodeValue`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FAILED_DEPENDENCY,
                        key: 'name',
                        message,
                    },
                ]);
            }

            body.activityCodeId = new ObjectId(body.activityCodeId);
            const nameDuplicatedActivityCodeValue =
                await this.activityCodeService.checkActivityCodeValueNameExist(
                    body.name,
                    body.activityCodeId,
                    body.projectId,
                );
            if (nameDuplicatedActivityCodeValue) {
                const message = await this.i18n.translate(
                    `activity-code.post.exists.activityCodeValue`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'name',
                        message,
                    },
                ]);
            }

            body.colorCode = body.colorCode.toUpperCase();
            const colorDuplicatedActivityCodeValue =
                await this.activityCodeService.checkActivityCodeValueColorExist(
                    body.colorCode,
                    body.projectId,
                );
            if (colorDuplicatedActivityCodeValue) {
                const message = await this.i18n.translate(
                    `activity-code.post.exists.activityCodeColor`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'colorCode',
                        message,
                    },
                ]);
            }

            body.createdBy = new ObjectId(req.loginUser._id);
            const newActivityCodeValue =
                await this.activityCodeService.createActivityCodeValue(body);
            this.projectNotificationService.createProjectNotification({
                target: body.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(body.projectId),
                type: ProjectNotificationType.CREATE_ACTIVITY_CODE_VALUE,
            });
            return new SuccessResponse(newActivityCodeValue);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createActivityCode(
        @Req() req,
        @Body(new JoiValidationPipe(ActivityCodeSchema))
        body: IActivityCodeBody,
    ) {
        try {
            body.projectId = new ObjectId(body.projectId);
            const project = await this.projectService.getProjectById(
                body.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const activityCodeNameExisted =
                await this.activityCodeService.checkActivityCodeNameExist(
                    body.name,
                    body.projectId,
                );
            if (activityCodeNameExisted) {
                const message = await this.i18n.translate(
                    `activity-code.post.exists.activityCode`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'name',
                        message,
                    },
                ]);
            }

            body.createdBy = new ObjectId(req.loginUser._id);
            const newActivityCode =
                await this.activityCodeService.createActivityCode(body);
            this.projectNotificationService.createProjectNotification({
                target: body.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(body.projectId),
                type: ProjectNotificationType.CREATE_ACTIVITY_CODE,
            });
            return new SuccessResponse(newActivityCode);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateActivityCode(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
        @Body(new JoiValidationPipe(ActivityCodeSchema))
        body: IActivityCodeBody,
    ) {
        try {
            body.projectId = new ObjectId(body.projectId);
            const project = await this.projectService.getProjectById(
                body.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const activityCode =
                await this.activityCodeService.getActivityCodeById(id);
            if (!activityCode) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.activityCode`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }

            if (body.name !== activityCode.name) {
                const activityCodeNameExisted =
                    await this.activityCodeService.checkActivityCodeNameExist(
                        body.name,
                        body.projectId,
                    );
                if (activityCodeNameExisted) {
                    const message = await this.i18n.translate(
                        `activity-code.post.exists.activityCode`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            key: 'name',
                            message,
                        },
                    ]);
                }
            }

            const updatedActivityCode =
                await this.activityCodeService.updateActivityCode(id, body);
            this.projectNotificationService.createProjectNotification({
                target: body.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(body.projectId),
                type: ProjectNotificationType.UPDATE_ACTIVITY_CODE,
            });
            return new SuccessResponse(updatedActivityCode);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Patch('/value/:id')
    async updateActivityCodeValue(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
        @Body(new JoiValidationPipe(ActivityCodeValueSchema))
        body: IActivityCodeValueBody,
    ) {
        try {
            const activityCodeValueId = new ObjectId(id);
            const activityCode =
                await this.activityCodeService.getActivityCodeValueById(
                    activityCodeValueId,
                );
            if (!activityCode) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.activityCodeValue`,
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            body.projectId = new ObjectId(body.projectId);
            const project = await this.projectService.getProjectById(
                body.projectId,
                ['_id'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.project`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'projectId',
                        message,
                    },
                ]);
            }

            const checkMaxLengthCodeName =
                this.activityCodeService.checkMaxLengthActivityCodeValueName(
                    body.name,
                    body.activityCodeId,
                );
            if (!checkMaxLengthCodeName) {
                const message = await this.i18n.translate(
                    `activity-code.post.failedDependency.activityCodeValue`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FAILED_DEPENDENCY,
                        key: 'name',
                        message,
                    },
                ]);
            }

            if (body.name !== activityCode.name) {
                const nameDuplicatedActivityCodeValue =
                    await this.activityCodeService.checkActivityCodeValueNameExist(
                        body.name,
                        activityCode.activityCodeId,
                        activityCode.projectId,
                        activityCodeValueId,
                    );
                if (nameDuplicatedActivityCodeValue) {
                    const message = await this.i18n.translate(
                        `activity-code.post.exists.activityCodeValue`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            key: 'name',
                            message,
                        },
                    ]);
                }
            }
            body.colorCode = body.colorCode.toUpperCase();
            if (body.colorCode !== activityCode.colorCode) {
                const colorDuplicatedActivityCode =
                    await this.activityCodeService.checkActivityCodeValueColorExist(
                        body.colorCode,
                        body.projectId,
                        activityCodeValueId,
                    );
                if (colorDuplicatedActivityCode) {
                    const message = await this.i18n.translate(
                        `activity-code.post.exists.activityCodeValueColor`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            key: 'colorCode',
                            message,
                        },
                    ]);
                }
            }

            body.updatedBy = new ObjectId(req.loginUser._id);
            const updatedActivityCodeValue =
                await this.activityCodeService.updateActivityCodeValue(
                    activityCodeValueId,
                    body,
                );
            this.projectNotificationService.createProjectNotification({
                target: body.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(body.projectId),
                type: ProjectNotificationType.UPDATE_ACTIVITY_CODE_VALUE,
            });
            return new SuccessResponse(updatedActivityCodeValue);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    async deleteActivityCode(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
    ) {
        try {
            const activityCode =
                await this.activityCodeService.getActivityCodeById(id);
            if (!activityCode) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.activityCode`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }

            await this.activityCodeService.deleteActivityCode(
                new ObjectId(id),
                new ObjectId(req.loginUser._id),
            );
            const message = await this.i18n.translate(
                'activity-code.delete.code.success',
            );
            this.projectNotificationService.createProjectNotification({
                target: activityCode.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(activityCode.projectId),
                type: ProjectNotificationType.DELETE_ACTIVITY_CODE,
            });
            return new SuccessResponse({ _id: id }, message as string);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Delete('/value/:id')
    async deleteActivityCodeValue(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) id: ObjectId,
    ) {
        try {
            const activityCodeValueId = new ObjectId(id);
            const activityCodeValue =
                await this.activityCodeService.getActivityCodeValueById(
                    activityCodeValueId,
                );
            if (!activityCodeValue) {
                const message = await this.i18n.translate(
                    `activity-code.get.notExists.activityCodeValue`,
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            await this.activityCodeService.deleteActivityCodeValue(
                new ObjectId(id),
                new ObjectId(req.loginUser._id),
            );
            const message = await this.i18n.translate(
                'activity-code.delete.codeValue.success',
            );
            this.projectNotificationService.createProjectNotification({
                target: activityCodeValue.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: new ObjectId(activityCodeValue.projectId),
                type: ProjectNotificationType.DELETE_ACTIVITY_CODE_VALUE,
            });
            return new SuccessResponse({ _id: id }, message as string);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/assign')
    async assignActivityCodeValue(
        @Req() req,
        @Body(new JoiValidationPipe(AssignActivityCodeSchema))
        body: IAssignActivityCodeValueBody,
    ) {
        try {
            const taskIds = body.taskIds.map((taskId) => new ObjectId(taskId));
            body.projectId = new ObjectId(body.projectId);

            const isTasksExist =
                await this.taskService.checkAllTaskIdsExistInProject(
                    taskIds,
                    body.projectId,
                );
            if (!isTasksExist) {
                const message = await this.i18n.translate(
                    'activity-code.get.notExists.taskIds',
                );
                return new ErrorResponse(HttpStatus.NOT_FOUND, message, []);
            }

            if (body.activityCodeValueId) {
                const activityCodeValueFound =
                    await this.activityCodeService.checkActivityCodeValueExist(
                        body.activityCodeValueId,
                        body.projectId,
                    );
                if (!activityCodeValueFound) {
                    const message = await this.i18n.translate(
                        'activity-code.get.notExists.activityCode',
                    );
                    return new ErrorResponse(HttpStatus.NOT_FOUND, message, []);
                }
            }

            await this.activityCodeService.assignActivityCodeValue({
                activityCodeValueId: body.activityCodeValueId,
                taskIds: taskIds,
                updatedBy: new ObjectId(req.loginUser._id),
            });
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
