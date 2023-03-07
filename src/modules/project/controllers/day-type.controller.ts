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
import { IDayType, DayTypeListQuery } from '../project.interface';
import {
    CreateDayTypeSchema,
    DayTypeQueryStringSchema,
    UpdateDayTypeSchema,
} from '../project.validator';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';
import { ProjectMongoService } from '../services/project.mongo.service';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { DayTypeMongoService } from '../services/day-type.mongo.service';

@Controller('/day-type')
@UseGuards(AuthenticationGuard)
export class DayTypeController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly projectService: ProjectMongoService,
        private readonly dayTypeService: DayTypeMongoService,
    ) {
        //
    }

    @Get('/')
    async getDayTypeList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(DayTypeQueryStringSchema),
        )
        query: DayTypeListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                query.projectId,
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
            const { items, totalItems } =
                await this.dayTypeService.getDayTypeList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':dayTypeId')
    async getDayTypeDetail(
        @Req() req,
        @Param('dayTypeId', ParseObjectIdPipe) dayTypeId: ObjectId,
    ) {
        try {
            const dayType = await this.dayTypeService.getDayTypeById(dayTypeId);
            return new SuccessResponse(dayType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('')
    async createDayType(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(CreateDayTypeSchema))
        body: IDayType,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                body.projectId || '',
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
            const createdDayType = await this.dayTypeService.createDayType({
                ...body,
                projectId: new ObjectId(body.projectId),
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse(createdDayType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':dayTypeId')
    async updateDayType(
        @Req() req,
        @Param('dayTypeId', ParseObjectIdPipe) dayTypeId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(UpdateDayTypeSchema))
        body: IDayType,
    ) {
        try {
            const dayType = await this.dayTypeService.getDayTypeById(dayTypeId);
            if (!dayType) {
                const message = await this.i18n.translate(
                    'project.errors.dayType.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const updatedDayType = await this.dayTypeService.updateDayType(
                dayTypeId,
                {
                    ...body,
                    updatedBy: new ObjectId(req.loginUser?._id),
                },
            );
            return new SuccessResponse(updatedDayType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':dayTypeId')
    async deleteDayType(
        @Req() req,
        @Param('dayTypeId', ParseObjectIdPipe) dayTypeId: ObjectId,
    ) {
        try {
            const dayType = await this.dayTypeService.getDayTypeById(dayTypeId);
            if (!dayType) {
                const message = await this.i18n.translate(
                    'project.errors.dayType.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            // TODO: check if day type is being assigned to calendar
            await this.dayTypeService.deleteDayType(
                dayTypeId,
                new ObjectId(req.loginUser?._id),
            );
            return new SuccessResponse({ _id: dayTypeId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
