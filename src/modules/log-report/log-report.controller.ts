import {
    Controller,
    Get,
    InternalServerErrorException,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import {
    ISupportRequestCategoryListQuery,
    IUserInCompanyListQuery,
    IUserStatusListQuery,
    IUserTimeListQuery,
} from './log-report.interface';
import { LogReportMongoService } from './service/log-report.service';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    supportRequestCategoryListQuerySchema,
    userInCompanyListQuerySchema,
    userStatusListQuerySchema,
    userTimeListQuerySchema,
} from './log-report.validator';
@Controller('/log-report')
@UseGuards(AuthenticationGuard)
export class LogReportController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly logReportService: LogReportMongoService,
    ) {
        //
    }

    @Get('/user-time-by-module')
    async getUserTimeByModuleList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userTimeListQuerySchema),
        )
        query: IUserTimeListQuery,
    ) {
        try {
            const userTimeList =
                await this.logReportService.getUserTimeByModuleList(query);
            return new SuccessResponse(userTimeList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/support-request-categories')
    async getSupportRequestCategoryList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(supportRequestCategoryListQuerySchema),
        )
        query: ISupportRequestCategoryListQuery,
    ) {
        try {
            const supportRequestCategoryList =
                await this.logReportService.getSupportRequestCategoryList(
                    query,
                );
            return new SuccessResponse(supportRequestCategoryList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/project-categories')
    async getProjectCategoryList() {
        try {
            const projectCategoryList =
                await this.logReportService.getProjectCategoryList();
            return new SuccessResponse(projectCategoryList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/user-status')
    async getUserStatusList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userStatusListQuerySchema),
        )
        query: IUserStatusListQuery,
    ) {
        try {
            const userStatusList =
                await this.logReportService.getUserStatusList(query);
            return new SuccessResponse(userStatusList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/user-in-company')
    async getUserInCompanyList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(userInCompanyListQuerySchema),
        )
        query: IUserInCompanyListQuery,
    ) {
        try {
            const userStatusList =
                await this.logReportService.getUserInCompanyList(query);
            return new SuccessResponse(userStatusList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
