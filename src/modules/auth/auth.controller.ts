import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { AccessModules, HttpStatus, UserRoles } from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { AuthMongoService } from './services/auth.mongo.service';
import bcrypt, { compareSync } from 'bcrypt';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import {
    extractToken,
    getAccessModules,
    hashPassword,
} from 'src/common/helpers/commonFunctions';
import {
    IActiveUserBody,
    IChangePasswordBody,
    ILoginForm,
    ILogoutBody,
    ILogoutOtherDeviceBody,
    IRegisterForm,
    IRequestResetPasswordForm,
    IResetPasswordBody,
    IUpdateProfileBody,
} from './auth.interface';
import {
    activeUserSchema,
    changePasswordFormSchema,
    loginSchema,
    logoutOtherDeviceSchema,
    logoutSchema,
    registerFormSchema,
    requestResetPasswordFormSchema,
    resetPasswordSchema,
    updateProfileSchema,
} from './auth.validator';
import { CountryMongoService } from '../common/services/country.mongo.service';
import { NotificationMongoService } from '../notification/services/notification.mongo.service';
import { NotificationTypes } from '../notification/notification.constant';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import { Types } from 'mongoose';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    AuditLogModules,
    AuditLogActions,
} from '../audit-log/audit-log.constant';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { LdapService } from '../../common/services/ldap-client.service';
import { RegistrationFrom } from '../user/user.constant';
import {
    MAX_REGISTER_FAILURE,
    profileAttributes,
    REGISTER_FAILURE_BLOCK_DURATION,
} from './auth.constant';
import { UserRegisterHistoryMongoService } from './services/user-register-history.service';
import moment from 'moment';
import { AccessLogMongoService } from '../access-log/services/access-log.mongo.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ConfigKey from 'src/common/config/config-key';
import { UserDocument } from '../user/mongo-schemas/user.schema';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { ObjectId } from 'mongodb';
import { RedisService } from 'src/common/services/redis.service';
import uniq from 'lodash/uniq';
import {
    ProjectPermissions,
    viewer3DPermissionPrefix,
} from '../3D-viewer-profile/viewer-3d-profile.constant';

@Controller('/auth')
export class AuthController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly authService: AuthMongoService,
        private readonly countryService: CountryMongoService,
        private readonly notificationService: NotificationMongoService,
        private readonly projectService: ProjectMongoService,
        private readonly userService: UserMongoService,
        private readonly auditLogService: AuditLogMongoService,
        private readonly accessLogService: AccessLogMongoService,
        private readonly ldapService: LdapService,
        private readonly userRegisterHistoryService: UserRegisterHistoryMongoService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly redisService: RedisService,
    ) {
        //
    }

    @UseGuards(AuthenticationGuard)
    @Get('/profile')
    async getProfile(@Req() req) {
        try {
            const profile = await this.authService.getProfileById(
                req.loginUser._id,
                [...profileAttributes, 'password'],
            );
            return new SuccessResponse({
                ...profile,
                password: undefined,
                isCurrentPasswordRequired: !!profile?.password?.length,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @UseGuards(AuthenticationGuard)
    @Patch('/profile')
    async updateProfile(
        @Req() req,
        @Body(new JoiValidationPipe(updateProfileSchema))
        body: IUpdateProfileBody,
    ) {
        try {
            body.updatedBy = req.loginUser._id;
            const existedProfile = await this.authService.getProfileById(
                body.updatedBy,
                ['_id'],
            );
            if (!existedProfile) {
                const message = await this.i18n.t(
                    'auth.errors.profile.notFound',
                );

                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const countryIdExist = await this.countryService.getCountryById(
                body.countryId,
            );
            if (!countryIdExist) {
                const message = await this.i18n.t(
                    'auth.errors.profile.countryId.notFound',
                );

                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'countryId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                    },
                ]);
            }
            const profile = await this.authService.updateProfile(
                req.loginUser._id,
                body,
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.UPDATE,
                targetObjectId: req?.loginUser?._id,
                description: '',
                createdBy: req?.loginUser?._id,
            });
            return new SuccessResponse(profile);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/register')
    async register(
        @Body(new JoiValidationPipe(registerFormSchema)) body: IRegisterForm,
    ) {
        try {
            const isEmailExist = await this.authService.getUserByEmail(
                body.email,
            );
            if (isEmailExist) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.email.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        key: 'email',
                        message,
                    },
                ]);
            }
            const isCountryExist = await this.countryService.getCountryById(
                body.countryId,
            );
            if (!isCountryExist) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.countryId.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'country',
                        message,
                    },
                ]);
            }

            const userRegisterHistory =
                await this.userRegisterHistoryService.getUserRegisterHistory(
                    body.email,
                );

            if (
                userRegisterHistory?.registerCount &&
                userRegisterHistory?.registerCount % MAX_REGISTER_FAILURE ===
                    0 &&
                moment().diff(
                    moment(userRegisterHistory.lastRegisterAt),
                    'hours',
                ) < REGISTER_FAILURE_BLOCK_DURATION
            ) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.block',
                );
                return new ErrorResponse(
                    HttpStatus.FAILED_DEPENDENCY,
                    message,
                    [],
                );
            }

            let projectId: Types.ObjectId | undefined;
            if (body.module === AccessModules.SPACIALYTIC_CONSTELLATION) {
                const project = await this.projectService.getProjectByName(
                    body.projectName,
                );

                if (!project) {
                    const message = await this.i18n.translate(
                        'auth.errors.auth.project.notExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            key: 'projectName',
                            message,
                        },
                    ]);
                } else if (project?.admin?.email !== body.projectAdminEmail) {
                    if (!userRegisterHistory) {
                        await this.userRegisterHistoryService.createUserRegisterHistory(
                            body.email,
                        );
                    } else {
                        await this.userRegisterHistoryService.addFailedRegister(
                            body.email,
                        );
                        if (
                            (userRegisterHistory.registerCount + 1) %
                                MAX_REGISTER_FAILURE ===
                            0
                        ) {
                            const message = await this.i18n.translate(
                                'auth.errors.auth.block',
                            );
                            return new ErrorResponse(
                                HttpStatus.FAILED_DEPENDENCY,
                                message,
                                [],
                            );
                        }
                    }
                    const message = await this.i18n.translate(
                        'auth.errors.auth.project.notExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            key: 'projectName',
                            message,
                        },
                    ]);
                }
                projectId = project._id;
            }
            if (userRegisterHistory) {
                await this.userRegisterHistoryService.deleteUserRegisterHistory(
                    body.email,
                );
            }

            body.registrationFrom = RegistrationFrom.SELF_REGISTER;
            const [message, registedUser] = await Promise.all([
                this.i18n.translate('auth.register.success'),
                this.authService.register(body),
            ]);
            await this.notificationService.createNotification({
                fromUserId: registedUser._id,
                createdBy: registedUser._id,
                type: NotificationTypes.REGISTER,
                accessModules: [body.module],
                projectId,
            });

            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.REGISTER,
                targetObjectId: registedUser._id,
                description: '',
                createdBy: registedUser._id,
            });
            return new SuccessResponse({ message });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/request-reset-password')
    async requestResetPassword(
        @Body(new JoiValidationPipe(requestResetPasswordFormSchema))
        body: IRequestResetPasswordForm,
    ) {
        try {
            const user = await this.authService.getUserByEmail(body.email);
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.email.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        key: 'email',
                        message,
                    },
                ]);
            }

            const userAccessModule = getAccessModules(
                user.accessModules,
                UserRoles.ADMIN,
            ).concat(
                getAccessModules(user.accessModules, UserRoles.NORMAL_USER),
            );

            await this.notificationService.createNotification({
                fromUserId: user._id,
                createdBy: user._id,
                type: NotificationTypes.RESET_PASSWORD,
                accessModules: uniq(userAccessModule),
            });

            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.RESET_PASSWORD,
                targetObjectId: user._id,
                description: '',
                createdBy: user._id,
            });
            return new SuccessResponse(
                this.i18n.translate('auth.resetPassword.checkEmail'),
            );
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/active-new-password')
    async activeNewPassword(
        @Req() req,
        @Body(new JoiValidationPipe(resetPasswordSchema))
        body: IResetPasswordBody,
    ) {
        try {
            const userTokenData = await this.authService.getUserToken(
                body.token,
            );

            if (!userTokenData) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.userService.activeNewPassword(userTokenData.userId);

            const user = await this.userService.getUserById(
                userTokenData.userId,
            );
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const permissions =
                await this.userService.getFullConstellationSecurityPermissionsOfUser(
                    user.id,
                );
            const [{ user: profile, accessToken, refreshToken }] =
                await Promise.all([
                    this.authService.login(user, permissions),
                    this.authService.deleteUserToken(
                        userTokenData._id,
                        user._id,
                    ),
                ]);
            await this.redisService.setUserAccessToken(
                user._id,
                accessToken.token,
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.RESET_PASSWORD,
                targetObjectId: user._id,
                description: '',
                createdBy: user._id,
            });
            return new SuccessResponse({ profile, accessToken, refreshToken });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    // check if account is being logged in
    @Post('/pre-login')
    async preLoginCheck(
        @Body(new JoiValidationPipe(loginSchema)) body: ILoginForm,
    ) {
        try {
            const user = await this.authService.getUserByEmail(body.email, [
                'password',
                'accessModules',
            ]);
            // check if user exists?
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.INVALID_USERNAME_OR_PASSWORD,
                    message,
                    [],
                );
            }

            if (!user?.accessModules?.length) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.accessModule.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.USER_HAVE_NOT_PERMISSION,
                    message,
                    [],
                );
            }
            // check password is correct?
            if (user.password) {
                const isCorrectPassword = await bcrypt.compare(
                    body.password,
                    user.password,
                );
                if (!isCorrectPassword) {
                    const message = await this.i18n.translate(
                        'auth.errors.user.notFound',
                    );
                    return new ErrorResponse(
                        HttpStatus.INVALID_USERNAME_OR_PASSWORD,
                        message,
                        [],
                    );
                }
            }

            const redisUserAccessToken =
                await this.redisService.getUserAccessToken(user._id);
            return new SuccessResponse({
                isBeingLoggedIn: !!redisUserAccessToken,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/login')
    async login(@Body(new JoiValidationPipe(loginSchema)) body: ILoginForm) {
        try {
            const user = await this.authService.getUserByEmail(body.email, [
                'password',
                'accessModules',
            ]);
            // check if user exists?
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.INVALID_USERNAME_OR_PASSWORD,
                    message,
                    [],
                );
            }

            if (!user?.accessModules?.length) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.accessModule.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.USER_HAVE_NOT_PERMISSION,
                    message,
                    [],
                );
            }
            // check password is correct?
            if (user.password) {
                const isCorrectPassword = await bcrypt.compare(
                    body.password,
                    user.password,
                );
                if (!isCorrectPassword) {
                    const message = await this.i18n.translate(
                        'auth.errors.user.notFound',
                    );
                    return new ErrorResponse(
                        HttpStatus.INVALID_USERNAME_OR_PASSWORD,
                        message,
                        [],
                    );
                }
            }
            const returnedUser = await this.authService.getUserByEmail(
                body?.email,
            );
            const permissions =
                await this.userService.getFullConstellationSecurityPermissionsOfUser(
                    user.id,
                );
            const {
                user: profile,
                accessToken,
                refreshToken,
                isExistOtherTokenUnexpired,
            } = await this.authService.login(returnedUser, permissions);

            await this.redisService.setUserAccessToken(
                user._id,
                accessToken.token,
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.LOGIN,
                targetObjectId: user._id,
                description: '',
                createdBy: user._id,
            });
            return new SuccessResponse({
                profile,
                accessToken,
                refreshToken,
                isExistOtherTokenUnexpired,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('refresh-token')
    async refreshToken(@Req() req) {
        try {
            const token = extractToken(req.headers.authorization);
            let loginUser;
            try {
                loginUser = await this.jwtService.verify(token, {
                    secret: this.configService.get(
                        ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                    ),
                    ignoreExpiration: false,
                });
            } catch (error) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.invalid',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }

            const user = await this.authService.getProfileById(loginUser._id);

            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const isHashTokenExist = await this.authService.checkHashToken(
                token,
            );
            if (!isHashTokenExist) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.hashToken.notExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }
            const permissions =
                await this.userService.getFullConstellationSecurityPermissionsOfUser(
                    user._id,
                );
            const { accessToken, refreshToken } =
                await this.authService.refreshToken(
                    user as UserDocument,
                    token,
                    permissions,
                );
            await this.redisService.setUserAccessToken(
                user._id,
                accessToken.token,
            );

            return new SuccessResponse({
                profile: user,
                accessToken,
                refreshToken,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('logout')
    async logout(@Body(new JoiValidationPipe(logoutSchema)) body: ILogoutBody) {
        try {
            let loginUser;
            try {
                loginUser = await this.jwtService.verify(body.refreshToken, {
                    secret: this.configService.get(
                        ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                    ),
                    ignoreExpiration: false,
                });
            } catch (error) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.invalid',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }
            await this.redisService.deleteAccessToken(
                new ObjectId(loginUser._id),
            );
            this.accessLogService.updateAccessLog(body.accessLogId, {
                logoutAt: new Date(),
                updatedBy: loginUser._id,
            });
            this.authService.logout(loginUser._id, body);

            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.LOGOUT,
                targetObjectId: loginUser._id,
                description: '',
                createdBy: loginUser._id,
            });
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('remove-user')
    @UseGuards(AuthenticationGuard)
    async deleteUserToken(@Req() req) {
        try {
            const token = extractToken(req.headers.authorization);
            if (!this.authService.checkHashToken(token)) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.hashToken.notExist',
                );
                return new ErrorResponse(HttpStatus.UNAUTHORIZED, message, []);
            }
            const user = await this.jwtService.verify(token, {
                secret: this.configService.get(
                    ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                ),
                ignoreExpiration: false,
            });
            this.authService.deleteToken(token);

            this.auditLogService.createAuditLog({
                module: AuditLogModules.AUTH,
                action: AuditLogActions.DELETE_TOKEN,
                targetObjectId: user._id,
                description: '',
                createdBy: user._id,
            });
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('active-user')
    async activeUser(
        @Req() req,
        @Body(new JoiValidationPipe(activeUserSchema)) body: IActiveUserBody,
    ) {
        try {
            const userTokenData = await this.authService.getUserToken(
                body.token,
            );

            if (!userTokenData) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.userService.activeUser(
                userTokenData.userId,
                req.loginUser?._id,
            );

            const user = await this.userService.getUserById(
                userTokenData.userId,
            );
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.auth.token.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            const permissions =
                await this.userService.getFullConstellationSecurityPermissionsOfUser(
                    user.id,
                );
            const [{ user: profile, accessToken, refreshToken }] =
                await Promise.all([
                    this.authService.login(user, permissions),
                    this.authService.deleteUserToken(
                        userTokenData._id,
                        user._id,
                    ),
                ]);
            await this.redisService.setUserAccessToken(
                user._id,
                accessToken.token,
            );
            this.auditLogService.createAuditLog({
                module: AuditLogModules.USER,
                action: AuditLogActions.ACTIVE,
                targetObjectId: user._id,
                description: '',
                createdBy: user._id,
            });
            return new SuccessResponse({ profile, accessToken, refreshToken });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/change-password')
    @UseGuards(AuthenticationGuard)
    async changePassword(
        @Req() req,
        @Body(new JoiValidationPipe(changePasswordFormSchema))
        body: IChangePasswordBody,
    ) {
        try {
            const user = await this.userService.getUserById(
                req.loginUser?._id,
                true,
            );
            if (!user) {
                const message = await this.i18n.translate(
                    'auth.errors.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                (!user?.password?.length && body.currentPassword?.length) ||
                (user?.password?.length &&
                    !compareSync(body.currentPassword, user.password))
            ) {
                const message = await this.i18n.translate(
                    'auth.errors.user.invalidPassword',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'currentPassword',
                        errorCode: HttpStatus.INVALID_USERNAME_OR_PASSWORD,
                        message,
                    },
                ]);
            }
            if (
                user?.password?.length &&
                compareSync(body.password, user.password)
            ) {
                const message = await this.i18n.translate(
                    'auth.errors.user.duplicatePassword',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'password',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }

            body.password = hashPassword(body.password);

            const updatedUser = await this.userService.updateUser(
                req.loginUser?._id,
                {
                    password: body.password,
                    needToChangePassword: false,
                },
            );
            return new SuccessResponse(updatedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @UseGuards(AuthenticationGuard)
    @Get('/constellation-security-permission')
    async getConstellationSecurityPermissions(@Req() req) {
        try {
            const constellationPermissions =
                await this.userService.getFullConstellationSecurityPermissionsOfUser(
                    req.loginUser._id,
                );
            return new SuccessResponse({
                constellationSecurityPermissions: constellationPermissions,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @UseGuards(AuthenticationGuard)
    @Get('/3d-viewer-permission')
    async get3dViewerPermissions(@Req() req) {
        try {
            let viewer3dPermissions = [];
            if (
                getAccessModules(
                    req.loginUser?.accessModules,
                    UserRoles.ADMIN,
                ).includes(AccessModules.SPACIALYTIC_3DWEBVIEWER)
            ) {
                viewer3dPermissions = Object.values(ProjectPermissions).filter(
                    (permission) =>
                        permission.startsWith(viewer3DPermissionPrefix),
                );
            } else {
                viewer3dPermissions =
                    await this.userService.getFullViewer3dPermissionsOfUser(
                        req.loginUser._id,
                    );
            }

            return new SuccessResponse({
                viewer3dPermissions,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @UseGuards(AuthenticationGuard)
    @Get('/project/:id/security-permission')
    async getProjectSecurityPermissions(
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Req() req,
    ) {
        try {
            const project = await this.projectService.getProjectById(id);
            if (!project) {
                const message = await this.i18n.translate(
                    'auth.errors.project.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const permissions =
                await this.userService.getProjectSecurityPermissionsOfUser(
                    new ObjectId(req.loginUser._id),
                    id,
                );

            return new SuccessResponse({
                projectSecurityPermissions: permissions,
                adminId: project.adminId,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @UseGuards(AuthenticationGuard)
    @Get('/project/:id/3d-viewer-permission')
    async getProject3dViewerPermissions(
        @Param('id', ParseObjectIdPipe) id: ObjectId,
        @Req() req,
    ) {
        try {
            const permissions =
                await this.userService.getProject3dViewerPermissionsOfUser(
                    new ObjectId(req.loginUser._id),
                    id,
                );
            return new SuccessResponse({
                projectViewer3dPermissions: permissions,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('logout-other-device')
    @UseGuards(AuthenticationGuard)
    async logoutOther(
        @Req() req,
        @Body(new JoiValidationPipe(logoutOtherDeviceSchema))
        body: ILogoutOtherDeviceBody,
    ) {
        try {
            const result = await this.authService.logoutOtherDevice(
                req.loginUser._id,
                body,
            );

            await this.redisService.setUserAccessToken(
                req.loginUser?._id,
                req.accessToken,
            );

            return new SuccessResponse(result);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
