import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { ProjectNotificationType } from '../project.constant';
import {
    IBaselineConfigurationBody,
    IBaselineConfigurationQuery,
} from '../project.interface';
import {
    baselineConfigurationQuerySchema,
    createBaselineConfigurationSchema,
} from '../project.validator';
import { BaselineConfigurationMongoService } from '../services/baseline-configuration.mongo.service';
import { PlanningMongoService } from '../services/planning.mongo.service';
import { ProjectNotificationMongoService } from '../services/project-notification.mongo.service';

@Controller('/baseline-configuration')
@UseGuards(AuthenticationGuard)
export class BaselineConfigurationController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly planningService: PlanningMongoService,
        private readonly baselineConfigurationService: BaselineConfigurationMongoService,
        private readonly projectNotificationService: ProjectNotificationMongoService,
    ) {
        //
    }

    @Get('/')
    async getBaselineConfiguration(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(baselineConfigurationQuerySchema),
        )
        query: IBaselineConfigurationQuery,
    ) {
        try {
            const projectPlanning = await this.planningService.getPlanningById(
                new ObjectId(query.planningId),
            );

            if (!projectPlanning) {
                const message = await this.i18n.translate(
                    'baseline-configuration.get.notExists.planning',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'planningId',
                        message,
                    },
                ]);
            }

            const baselineConfiguration =
                await this.baselineConfigurationService.getBaselineConfiguration(
                    query,
                );

            return new SuccessResponse(baselineConfiguration);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateBaselineConfiguration(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(createBaselineConfigurationSchema))
        body: IBaselineConfigurationBody,
    ) {
        try {
            const baselineConfiguration =
                await this.baselineConfigurationService.getBaselineConfigurationById(
                    new ObjectId(id),
                );

            if (!baselineConfiguration) {
                const message = await this.i18n.translate(
                    'baseline-configuration.patch.notExists.baselineConfiguration',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'id',
                        message,
                    },
                ]);
            }

            const updateBaselineConfiguration =
                await this.baselineConfigurationService.updateBaselineConfiguration(
                    new ObjectId(id),
                    {
                        ...body,
                        updatedBy: req.loginUser._id,
                    },
                );
            const planning = await this.planningService.getPlanningById(
                baselineConfiguration.planningId,
            );
            if (planning) {
                this.projectNotificationService.createProjectNotification({
                    target: `${planning.name}.planning`,
                    createdBy: new ObjectId(req.loginUser?._id),
                    projectId: planning.projectId,
                    type: ProjectNotificationType.UPDATE_BASELINE_CONFIGURATION,
                });
            }
            return new SuccessResponse(updateBaselineConfiguration);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
