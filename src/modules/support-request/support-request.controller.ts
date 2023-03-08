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
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectId } from 'mongodb';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    AuditLogActions,
    AuditLogModules,
} from '../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { SupportRequestService } from './service/support-request.mongo.service';
import {
    ICreateSupportRequest,
    ISupportRequestExportListQuery,
    ISupportRequestListQuery,
    IUpdateSupportRequest,
} from './support-request.interface';
import {
    exportSupportRequestListQuerySchema,
    supportRequestListQuerySchema,
    supportRequestSchema,
} from './support-request.validator';
import { renameSync } from 'fs';
import { IFileBody } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Controller('/support-request')
@UseGuards(AuthenticationGuard)
export class SupportRequestController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly supportRequestService: SupportRequestService,
    ) {}

    @Get('/')
    async getSupportRequestList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(supportRequestListQuerySchema),
        )
        query: ISupportRequestListQuery,
    ) {
        const isHasViewAllPermission =
            this.supportRequestService.checkViewAllPermission(
                req?.loginUser,
                query.accessModule,
            );
        if (!isHasViewAllPermission) {
            query.createdBy = req?.loginUser?._id;
        }
        const supportRequest =
            await this.supportRequestService.getSupportRequestList(query);
        return new SuccessResponse(supportRequest);
    }

    @Get('/export-csv')
    @UseGuards(AuthenticationGuard)
    async exportCSV(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(exportSupportRequestListQuerySchema),
        )
        query: ISupportRequestExportListQuery,
    ) {
        try {
            const isHasViewAllPermission =
                this.supportRequestService.checkViewAllPermission(
                    req?.loginUser,
                    query.accessModule,
                );
            if (!isHasViewAllPermission) {
                query.createdBy = req?.loginUser?._id;
            }
            this.supportRequestService.exportSupportRequestList(query);
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    async getSupportRequest(@Param('id', ParseObjectIdPipe) id: ObjectId) {
        try {
            const supportRequest =
                await this.supportRequestService.getSupportRequestById(id);
            if (!supportRequest) {
                const message = await this.i18n.translate(
                    'support-request.errors.supportRequest.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(supportRequest);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createSupportRequest(
        @Req() req,
        @Body(new JoiValidationPipe(supportRequestSchema))
        body: ICreateSupportRequest,
    ) {
        try {
            const createSupportRequest =
                await this.supportRequestService.createSupportRequest({
                    ...body,
                    createdBy: new ObjectId(req?.loginUser?._id),
                });

            this.auditLogService.createAuditLog({
                module: AuditLogModules.SUPPORT_REQUEST,
                action: AuditLogActions.CREATE,
                targetObjectId: createSupportRequest._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse(createSupportRequest);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    async updateSupportRequest(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(new JoiValidationPipe(supportRequestSchema))
        body: IUpdateSupportRequest,
    ) {
        try {
            const supportRequest =
                await this.supportRequestService.getSupportRequestById(id);
            if (!supportRequest) {
                const message = await this.i18n.translate(
                    'support-request.errors.supportRequest.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const updateSupportRequest =
                await this.supportRequestService.updateSupportRequest(id, {
                    ...body,
                    updatedBy: new ObjectId(req?.loginUser?._id),
                });

            this.auditLogService.createAuditLog({
                module: AuditLogModules.SUPPORT_REQUEST,
                action: AuditLogActions.UPDATE,
                targetObjectId: new ObjectId(id),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse(updateSupportRequest);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    async deleteSupportRequest(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const supportRequest =
                await this.supportRequestService.getSupportRequestById(id);
            if (!supportRequest) {
                const message = await this.i18n.translate(
                    'support-request.errors.supportRequest.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            await this.supportRequestService.deleteSupportRequest(
                id,
                req?.loginUser?._id,
            );

            this.auditLogService.createAuditLog({
                module: AuditLogModules.SUPPORT_REQUEST,
                action: AuditLogActions.DELETE,
                targetObjectId: new ObjectId(id),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });

            return new SuccessResponse({ id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/file')
    @UseGuards(AuthenticationGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            dest: process.env.FILE_STORAGE_SUPPORT_REQUEST_FOLDER,
        }),
    )
    async uploadFile(@UploadedFile() file: IFileBody) {
        try {
            const fileName = `${uuidv4()}-${file.originalname}`;
            renameSync(
                `${process.env.FILE_STORAGE_SUPPORT_REQUEST_FOLDER}/${file.filename}`,
                `${process.env.FILE_STORAGE_SUPPORT_REQUEST_FOLDER}/${fileName}`,
            );
            return new SuccessResponse({
                ...file,
                path: `${process.env.FILE_STORAGE_SUPPORT_REQUEST_FOLDER}/${fileName}`,
                filename: fileName,
                type: file.mimetype,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
