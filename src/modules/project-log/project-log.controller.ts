import {
    Controller,
    Get,
    InternalServerErrorException,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { SecurityPermissions } from '../security-profile/security-profile.constant';
import { IProjectLogListQuery } from './project-log.interface';
import { projectLogListQuerySchema } from './project-log.validator';
import { ProjectLogMongoService } from './services/project-log.service';
import { I18nRequestScopeService } from 'nestjs-i18n';

@Controller('/project-log')
export class ProjectLogController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly configService: ConfigService,
    ) {}

    @Get('')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @Permissions([SecurityPermissions.ACCESS_PROJECT_LOGS_REPORTS])
    async getProjectLogList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(projectLogListQuerySchema),
        )
        query: IProjectLogListQuery,
    ) {
        try {
            const projectLogList =
                await this.projectLogService.getListProjectLog(query);
            return new SuccessResponse(projectLogList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
