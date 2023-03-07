import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { AccessModules, HttpStatus, UserRoles } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    AuditLogModules,
    AuditLogActions,
} from '../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { NotificationStatus } from './notification.constant';
import {
    ICountPendingNotification,
    IGetNotification,
    IRejectNotification,
} from './notification.interface';
import {
    CountPendingNotificationQueryStringSchema,
    NotificationQueryStringSchema,
    RejectNotificationSchema,
} from './notification.validator';
import { NotificationMongoService } from './services/notification.mongo.service';
import intersection from 'lodash/intersection';
import { SecurityPermissions } from '../security-profile/security-profile.constant';
import {
    getAccessModules,
    hasSecurityPermissions,
} from 'src/common/helpers/commonFunctions';

@Controller('/notification')
@UseGuards(AuthenticationGuard)
export class NotificationController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly notificationService: NotificationMongoService,
        private readonly auditLogService: AuditLogMongoService,
    ) {
        //
    }

    @Get('/')
    async getNotificationList(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(NotificationQueryStringSchema),
        )
        query: IGetNotification,
    ) {
        try {
            if (
                !this.notificationService.checkUserHavePermission(
                    req.loginUser,
                    query.accessModules,
                )
            ) {
                const message = await this.i18n.translate(
                    'notification.errors.forbidden',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FORBIDDEN,
                        key: 'accessModules',
                        message,
                    },
                ]);
            }

            const loginUserAccessModules = getAccessModules(
                req?.loginUser.accessModules,
                UserRoles.ADMIN,
            );

            if (!loginUserAccessModules.length)
                return new SuccessResponse({ items: [], totalItems: 0 });

            query.accessModules = query.accessModules?.length
                ? intersection(loginUserAccessModules, query.accessModules)
                : loginUserAccessModules;

            if (!query.accessModules.length)
                return new SuccessResponse({ items: [], totalItems: 0 });
            if (
                query.accessModules.includes(AccessModules.SPACIALYTIC_PLATFORM)
            ) {
                query.accessModules = [
                    AccessModules.SPACIALYTIC_PLATFORM,
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                    AccessModules.SPACIALYTIC_3DWEBVIEWER,
                ];
            }
            const [items, totalItems] =
                await this.notificationService.getNotificationList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/pending')
    async countNotification(
        @Req() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(CountPendingNotificationQueryStringSchema),
        )
        query: ICountPendingNotification,
    ) {
        try {
            const loginUserAccessModules = getAccessModules(
                req?.loginUser.accessModules,
                UserRoles.ADMIN,
            );

            const accessModulesQuery = intersection(
                query.accessModules,
                loginUserAccessModules,
            );
            if (accessModulesQuery.length !== query.accessModules.length) {
                const message = await this.i18n.translate(
                    'notification.errors.forbidden',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FORBIDDEN,
                        key: 'accessModules',
                        message,
                    },
                ]);
            }
            if (
                accessModulesQuery.includes(
                    AccessModules.SPACIALYTIC_CONSTELLATION,
                ) &&
                !hasSecurityPermissions(req.loginUser, [
                    SecurityPermissions.ACCESS_NOTIFICATION,
                ])
            ) {
                const message = await this.i18n.translate(
                    'notification.errors.forbidden',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FORBIDDEN,
                        key: 'accessModules',
                        message,
                    },
                ]);
            }

            if (!loginUserAccessModules.length)
                return new SuccessResponse({ totalItems: 0 });

            const pendingNotificationCount =
                await this.notificationService.countPendingNotifiction(
                    accessModulesQuery,
                );

            return new SuccessResponse({
                totalItems: pendingNotificationCount,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/:id/reject')
    async rejectNotification(
        @Req() req,
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Body(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(RejectNotificationSchema),
        )
        body: IRejectNotification,
    ) {
        try {
            const notification =
                await this.notificationService.getNotificationById(id);
            if (!notification) {
                const message = await this.i18n.translate(
                    'notification.errors.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            if (
                !this.notificationService.checkUserHavePermission(
                    req.loginUser,
                    notification.accessModules,
                )
            ) {
                const message = await this.i18n.translate(
                    'notification.errors.forbidden',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.FORBIDDEN,
                        key: 'accessModules',
                        message,
                    },
                ]);
            }
            if (notification.status !== NotificationStatus.PENDING) {
                const message = await this.i18n.translate(
                    'notification.errors.notPending',
                );
                return new ErrorResponse(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    message,
                );
            }

            body.updatedBy = new ObjectId(req?.loginUser?._id);
            body.status = NotificationStatus.REJECTED;

            const updatedNotification =
                await this.notificationService.rejectNotification(
                    id,
                    notification.type,
                    body,
                    notification.fromUserId as unknown as ObjectId,
                );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.NOTIFICATION,
                action: AuditLogActions.REJECT,
                targetObjectId: notification._id,
                description: '',
                createdBy: req?.loginUser?._id,
            });
            return new SuccessResponse(updatedNotification);
        } catch (error) {
            throw error;
            // throw new InternalServerErrorException(error);
        }
    }
}
