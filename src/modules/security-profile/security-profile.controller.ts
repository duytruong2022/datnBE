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
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'bson';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import {
    ICreateSecurityProfileBody,
    ISecurityProfileQuery,
    IUpdateSecurityProfleBody,
} from './security-profile.interface';
import {
    CreateSecurityProfileSchema,
    getSecurityProfileSchema,
    UpdateSecurityProfileSchema,
} from './security-profile.validator';
import { SecurityProfileService } from './services/security-profiles.mongo.service';
import {
    AuditLogModules,
    AuditLogActions,
} from '../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { SecurityPermissions } from './security-profile.constant';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('/security-profile')
export class SecurityProfileController {
    constructor(
        private readonly configService: ConfigService,
        private readonly securityProfileService: SecurityProfileService,
        private readonly i18n: I18nRequestScopeService,
        private readonly auditLogService: AuditLogMongoService,
    ) {}

    @Get('/')
    @Permissions([SecurityPermissions.CREATE_SECURITY_PROFILE])
    async getSecurityProfileList(
        @Query(new JoiValidationPipe(getSecurityProfileSchema))
        query: ISecurityProfileQuery,
    ) {
        try {
            const securityProfiles =
                await this.securityProfileService.getSecurityProfileList(query);
            return new SuccessResponse(securityProfiles);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    @Permissions([SecurityPermissions.CREATE_SECURITY_PROFILE])
    async createSecurityProfile(
        @Req() req,
        @Body(new JoiValidationPipe(CreateSecurityProfileSchema))
        body: ICreateSecurityProfileBody,
    ) {
        try {
            body.createdBy = new ObjectId(req.loginUser?._id);
            const nameExists =
                await this.securityProfileService.checkSecurityProfileNameExists(
                    body.name,
                );
            if (nameExists) {
                const message = await this.i18n.t(
                    'security-profile.item.name.exists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const securityProfile =
                await this.securityProfileService.createSecurityProfile(body);
            this.auditLogService.createAuditLog({
                module: AuditLogModules.SECURITY_PROFILE,
                action: AuditLogActions.CREATE,
                targetObjectId: securityProfile._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(securityProfile);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    @Permissions([SecurityPermissions.CREATE_SECURITY_PROFILE])
    async deleteSecurityProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
    ) {
        try {
            const securityProfile =
                await this.securityProfileService.getSecurityProfileById(_id);
            if (!securityProfile) {
                const message = await this.i18n.t(
                    'security-profile.item.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }

            // check SecurityProfile Assign To Group
            const isSecurityProfileAssignedToGroup =
                await this.securityProfileService.checkSecurityProfileAssignToGroup(
                    _id,
                );
            if (isSecurityProfileAssignedToGroup) {
                const message = await this.i18n.t(
                    'security-profile.delete.item.assignedToGroup',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }

            // check SecurityProfile Assign To User
            const isSecurityProfileAssignedToUser =
                await this.securityProfileService.checkSecurityProfileAssignToUser(
                    _id,
                );
            if (isSecurityProfileAssignedToUser) {
                const message = await this.i18n.t(
                    'security-profile.delete.item.assignedToUser',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }

            await this.securityProfileService.deleteSecurityProfile(
                _id,
                new ObjectId(req.loginUser?._id),
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.SECURITY_PROFILE,
                action: AuditLogActions.DELETE,
                targetObjectId: _id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse({ _id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    @Permissions([SecurityPermissions.CREATE_SECURITY_PROFILE])
    async updateSecurityProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
        @Body(new JoiValidationPipe(UpdateSecurityProfileSchema))
        body: IUpdateSecurityProfleBody,
    ) {
        try {
            body.updatedBy = new ObjectId(req.loginUser?._id);
            const securityProfile =
                await this.securityProfileService.getSecurityProfileById(_id);
            if (!securityProfile) {
                const message = await this.i18n.t(
                    'security-profile.item.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const nameExists =
                await this.securityProfileService.checkSecurityProfileNameExists(
                    body.name,
                    _id,
                );
            if (nameExists) {
                const message = await this.i18n.t(
                    'security-profile.item.name.exists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const updatedResults =
                await this.securityProfileService.updateSecurityProfile(
                    _id,
                    body,
                );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.SECURITY_PROFILE,
                action: AuditLogActions.UPDATE,
                targetObjectId: updatedResults._id,
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedResults);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
