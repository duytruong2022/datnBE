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

import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';

import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { BaselinePlanningMongoService } from '../services/baseline-planning.mongo.service';
import { PlanningMongoService } from '../services/planning.mongo.service';
import { AuditLogMongoService } from 'src/modules/audit-log/services/audit-log.service';
import {
    baselinePlanningListQuerySchema,
    createBaselinePlanningSchema,
} from '../project.validator';
import {
    AuditLogActions,
    AuditLogModules,
} from 'src/modules/audit-log/audit-log.constant';
import {
    IBaselinePlanningBody,
    IBaselinePlanningListQuery,
} from '../project.interface';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';
import { ProjectNotificationType } from '../project.constant';
@Controller('/baseline-planning')
@UseGuards(AuthenticationGuard)
export class BaselinePlanningController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly baselinePlanningService: BaselinePlanningMongoService,
        private readonly planningService: PlanningMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
    ) {
        //
    }

    @Get('/')
    async getBaselinePlanningList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(baselinePlanningListQuerySchema),
        )
        query: IBaselinePlanningListQuery,
    ) {
        try {
            const projectPlanning = await this.planningService.getPlanningById(
                new ObjectId(query.planningId),
            );

            if (!projectPlanning) {
                const message = await this.i18n.translate(
                    'baseline-planning.get.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const { items, totalItems } =
                await this.baselinePlanningService.getBaselinePlanningList(
                    query,
                );
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getBaselinePlanningDetail(
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const baselinePlanning =
                await this.baselinePlanningService.getBaselinePlanningById(
                    new ObjectId(id),
                );

            if (!baselinePlanning) {
                const message = await this.i18n.translate(
                    'baseline-planning.get.notExists.baselinePlanning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }
            return new SuccessResponse(baselinePlanning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createBaselinePlanning(
        @Req() req,
        @Body(new JoiValidationPipe(createBaselinePlanningSchema))
        body: IBaselinePlanningBody,
    ) {
        try {
            const projectPlanning = await this.planningService.getPlanningById(
                new ObjectId(body.planningId),
            );

            if (!projectPlanning) {
                const message = await this.i18n.translate(
                    'baseline-planning.get.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const checkBaselineNameExist =
                await this.baselinePlanningService.checkBaselineNameExist(body);
            if (checkBaselineNameExist) {
                const message = await this.i18n.translate(
                    'baseline-planning.post.exists.baselineName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'baselineName',
                        message,
                    },
                ]);
            }
            body.createdBy = req?.loginUser?._id;
            const newBaselinePlanning =
                await this.baselinePlanningService.createBaselinePlanning(body);

            this.auditLogService.createAuditLog({
                module: AuditLogModules.BASELINE_PLANNING,
                action: AuditLogActions.CREATE,
                targetObjectId: newBaselinePlanning._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            this.projectNotificationService.createProjectNotification({
                target: body.name,
                createdBy: new ObjectId(req.loginUser?._id),
                projectId: projectPlanning.projectId,
                type: ProjectNotificationType.CREATE_BASELINE,
            });
            return new SuccessResponse(newBaselinePlanning);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateBaselinePlanning(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(createBaselinePlanningSchema))
        body: IBaselinePlanningBody,
    ) {
        try {
            const baselinePlanning =
                await this.baselinePlanningService.getBaselinePlanningById(
                    new ObjectId(id),
                );

            if (!baselinePlanning) {
                const message = await this.i18n.translate(
                    'baseline-planning.get.notExists.baselinePlanning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }

            const checkBaselineNameExist =
                await this.baselinePlanningService.checkBaselineNameExist(
                    body,
                    new ObjectId(id),
                );
            if (checkBaselineNameExist) {
                const message = await this.i18n.translate(
                    'baseline-planning.post.exists.baselineName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'baselineName',
                        message,
                    },
                ]);
            }
            const updateBaselinePlanning =
                this.baselinePlanningService.updateBaselinePlanning(
                    new ObjectId(id),
                    {
                        ...body,
                        updatedBy: req.loginUser._id,
                    },
                );
            const planning = await this.planningService.getPlanningById(
                baselinePlanning.planningId,
            );
            if (planning) {
                this.projectNotificationService.createProjectNotification({
                    target: body.name,
                    createdBy: new ObjectId(req.loginUser?._id),
                    projectId: planning.projectId,
                    type: ProjectNotificationType.UPDATE_BASELINE,
                });
            }
            return new SuccessResponse(updateBaselinePlanning);
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
            const baselinePlanning =
                await this.baselinePlanningService.getBaselinePlanningById(
                    new ObjectId(id),
                );

            if (!baselinePlanning) {
                const message = await this.i18n.translate(
                    'baseline-planning.get.notExists.baselinePlanning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }
            await this.baselinePlanningService.deleteBaselinePlanning(
                new ObjectId(id),
                new ObjectId(req?.loginUser?._id),
            );
            const planning = await this.planningService.getPlanningById(
                baselinePlanning.planningId,
            );
            if (planning) {
                this.projectNotificationService.createProjectNotification({
                    target: baselinePlanning.name,
                    createdBy: new ObjectId(req.loginUser?._id),
                    projectId: planning.projectId,
                    type: ProjectNotificationType.DELETE_BASELINE,
                });
            }
            const message = await this.i18n.translate(
                'base-planning.delete.success',
            );
            return new SuccessResponse({ _id: id }, message as string);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
