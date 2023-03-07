import { ObjectId } from 'bson';
import { ParseObjectIdPipe } from '../../common/pipe/objectId.validation.pipe';
import {
    Body,
    Controller,
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
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import {
    accessLogListQuerySchema,
    createAccessLogSchema,
} from './access-log.validator';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { AccessModules, HttpStatus, UserRoles } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import {
    IAccessLogCreateBody,
    IAccessLogListQuery,
} from './access-log.interface';
import { AccessLogMongoService } from './services/access-log.mongo.service';
import { getAccessModules } from 'src/common/helpers/commonFunctions';
@Controller('/access-log')
@UseGuards(AuthenticationGuard)
export class AccessLogController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly accessLogService: AccessLogMongoService,
    ) {
        //
    }

    @Get('/')
    async getAccessLogList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(accessLogListQuerySchema),
        )
        query: IAccessLogListQuery,
    ) {
        try {
            if (
                !getAccessModules(
                    req.loginUser?.accessModules,
                    UserRoles.ADMIN,
                ).includes(AccessModules.SPACIALYTIC_3DWEBVIEWER) &&
                !getAccessModules(
                    req.loginUser?.accessModules,
                    UserRoles.ADMIN,
                ).includes(AccessModules.SPACIALYTIC_PLATFORM)
            ) {
                const message = await this.i18n.translate(
                    'access-log.message.error.forbidden',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const accessLogList = await this.accessLogService.getAccessLogList(
                query,
            );
            return new SuccessResponse(accessLogList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getAccessLogDetail(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            if (
                !getAccessModules(
                    req.loginUser?.accessModules,
                    UserRoles.ADMIN,
                ).includes(AccessModules.SPACIALYTIC_3DWEBVIEWER) &&
                !getAccessModules(
                    req.loginUser?.accessModules,
                    UserRoles.NORMAL_USER,
                ).includes(AccessModules.SPACIALYTIC_PLATFORM)
            ) {
                const message = await this.i18n.translate(
                    'access-log.message.error.forbidden',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const accessLog = await this.accessLogService.getAccessLogDetail(
                id,
            );
            if (!accessLog) {
                const message = await this.i18n.translate(
                    'access-log.message.error.itemNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(accessLog);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async createAccessLog(
        @Req() req,
        @Body(new JoiValidationPipe(createAccessLogSchema))
        body: IAccessLogCreateBody,
    ) {
        try {
            const newAccessLog = { ...body };
            if (body.projectId?.toString()?.length) {
                delete newAccessLog.module;
            }
            const createdAccessLog =
                await this.accessLogService.createAccessLog({
                    ...newAccessLog,
                    loginAt: new Date(),
                    userId: new ObjectId(req.loginUser?._id),
                    createdBy: new ObjectId(req.loginUser?._id),
                });
            return new SuccessResponse(createdAccessLog);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    async updateAccessLog(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
    ) {
        try {
            const updatedAccessLog =
                await this.accessLogService.updateAccessLog(id, {
                    logoutAt: new Date(),
                    updatedBy: new ObjectId(req.loginUser?._id),
                });
            return new SuccessResponse(updatedAccessLog);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
