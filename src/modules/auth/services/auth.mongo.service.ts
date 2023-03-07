import {
    Group,
    GroupDocument,
} from 'src/modules/group/mongo-schemas/group.schema';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/mongo-schemas/user.schema';
import {
    UserToken,
    UserTokenDocument,
} from '../mongo-schemas/user-token.schema.dto';
import { MODULE_NAME, profileAttributes } from '../auth.constant';
import { JwtService } from '@nestjs/jwt';
import ConfigKey from 'src/common/config/config-key';
import { ObjectId } from 'mongodb';
const userAttributes = [
    'email',
    'firstName',
    'lastName',
    'accessModules',
    'needToChangePassword',
    'status',
];
import {
    ILogoutBody,
    ILogoutOtherDeviceBody,
    IRegisterForm,
    IUpdateProfileBody,
} from '../auth.interface';
import {
    softDeleteCondition,
    UserRoles,
    UserStatus,
} from 'src/common/constants';
import {
    SecurityProfile,
    SecurityProfileDocument,
} from 'src/modules/security-profile/mongo-schemas/security-profile.schema';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
@Injectable()
export class AuthMongoService {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(UserToken.name)
        private readonly userTokenModel: Model<UserTokenDocument>,
        @InjectModel(SecurityProfile.name)
        private readonly securityProfileModel: Model<SecurityProfileDocument>,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );
    /**
     *
     * @param user
     * @return accessToken & accessTokenExpiredIn
     */
    private generateAccessToken(
        user: UserDocument,
        permissions: SecurityPermissions[],
    ) {
        const accessTokenExpiredIn = this.configService.get(
            ConfigKey.JWT_ACCESS_TOKEN_EXPIRED_IN,
        );
        const secretAccessTokenKey = this.configService.get(
            ConfigKey.JWT_ACCESS_TOKEN_SECRET_KEY,
        );
        const accessTokenOptions = {
            secret: secretAccessTokenKey,
            expiresIn: accessTokenExpiredIn,
        };
        const payloadAccessToken = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            accessModules: user.accessModules,
            permissions,
            expiresIn: accessTokenExpiredIn,
        };
        const accessToken = this.jwtService.sign(
            payloadAccessToken,
            accessTokenOptions,
        );
        return {
            token: accessToken,
            expiresIn: accessTokenExpiredIn,
        };
    }
    /**
     *
     * @param user
     * @param hashToken
     * @return refreshToken && refreshTokenExpiredIn
     */
    private generateRefreshToken(user: UserDocument, hashToken: string) {
        const refreshTokenExpiredIn = this.configService.get(
            ConfigKey.JWT_REFRESH_TOKEN_EXPIRED_IN,
        );
        const secretRefreshTokenKey = this.configService.get(
            ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
        );
        const accessTokenOptions = {
            secret: secretRefreshTokenKey,
            expiresIn: refreshTokenExpiredIn,
        };
        const payloadAccessToken = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            expiresIn: refreshTokenExpiredIn,
            hashToken,
        };
        const refreshToken = this.jwtService.sign(
            payloadAccessToken,
            accessTokenOptions,
        );

        return {
            token: refreshToken,
            expiresIn: refreshTokenExpiredIn,
        };
    }

    generateHashToken(userId: string): string {
        return `${userId}-${Date.now()}`;
    }

    /**
     *
     * @param user User
     * @returns {user, accessToken, refreshToken}
     */

    public async login(
        loginUser: UserDocument,
        permissions: SecurityPermissions[],
    ) {
        try {
            const accessToken = this.generateAccessToken(
                loginUser,
                permissions,
            );
            const hashToken = this.generateHashToken(loginUser?._id);
            const refreshToken = this.generateRefreshToken(
                loginUser,
                hashToken,
            );

            await this.userTokenModel.create({
                userId: new ObjectId(loginUser._id),
                token: refreshToken.token,
                hashToken,
                createdBy: new ObjectId(loginUser._id),
                deletedAt: new Date().getTime() + refreshToken.expiresIn * 1000,
                deletedBy: new ObjectId(loginUser._id),
            });
            await this.userModel.updateOne(
                {
                    ...softDeleteCondition,
                    _id: loginUser._id,
                },
                {
                    $set: {
                        lastLoginAt: new Date(),
                    },
                },
            );

            const user = await this.getProfileById(loginUser._id);
            const isExistOtherTokenUnexpired =
                await this.checkExistOtherTokenUnexpired(
                    loginUser._id,
                    refreshToken.token,
                );
            return {
                user,
                accessToken,
                refreshToken,
                isExistOtherTokenUnexpired,
            };
        } catch (error) {
            this.logger.error('Error in login service', error);
            throw error;
        }
    }

    public async getUserByEmail(email: string, attributes = userAttributes) {
        try {
            const user = await this.userModel
                .findOne({
                    ...softDeleteCondition,
                    email,
                })
                .select(attributes);
            return user;
        } catch (error) {
            this.logger.error('Error in get user by email', error);
            throw error;
        }
    }

    public async getUserByLdapUsername(
        ldapUsername: string,
        attributes = userAttributes,
    ) {
        try {
            const user = await this.userModel
                .findOne({ ...softDeleteCondition, ldapUsername })
                .select(attributes);
            return user;
        } catch (error) {
            this.logger.error('Error in get user by ldap username', error);
            throw error;
        }
    }

    public async checkHashToken(token: string) {
        try {
            const data = await this.jwtService.verify(token, {
                secret: this.configService.get(
                    ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                ),
            });
            const isHashTokenExist =
                (await this.userTokenModel.countDocuments({
                    deletedAt: {
                        $gte: new Date(),
                    },
                    hashToken: data.hashToken,
                })) > 0;
            return isHashTokenExist;
        } catch (error) {
            throw error;
        }
    }

    public async refreshToken(
        loginUser: UserDocument,
        token: string,
        permissions: SecurityPermissions[],
    ) {
        try {
            const accessToken = this.generateAccessToken(
                loginUser,
                permissions,
            );
            const hashToken = this.generateHashToken(loginUser._id);
            const refreshToken = this.generateRefreshToken(
                loginUser,
                hashToken,
            );

            // delete old refresh token
            await this.deleteToken(token);

            // add refresh token to user_tokens table.
            await this.userTokenModel.create({
                userId: new ObjectId(loginUser._id),
                token: refreshToken.token,
                hashToken,
                createdBy: new ObjectId(loginUser._id),
                deletedAt: new Date().getTime() + refreshToken.expiresIn * 1000,
                deletedBy: new ObjectId(loginUser._id),
            });
            return {
                accessToken,
                refreshToken,
            };
        } catch (error) {
            this.logger.error('Error in refresh token service', error);
            throw error;
        }
    }

    public async deleteToken(token: string): Promise<boolean> {
        try {
            const data = await this.jwtService.verify(token, {
                secret: this.configService.get(
                    ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                ),
            });

            // delete old refresh token
            await this.userTokenModel.deleteMany({
                hashToken: data.hashToken,
            });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async register(userData: IRegisterForm) {
        try {
            const user = new this.userModel({
                ...userData,
                accessModules: [
                    {
                        module: userData.module,
                        roles: [UserRoles.NORMAL_USER],
                    },
                ],
                status: UserStatus.REGISTERING,
            });
            user.createdBy = user._id;
            return user.save();
        } catch (error) {
            throw error;
        }
    }

    async getProfileById(_id: ObjectId, attrs = profileAttributes) {
        try {
            return await this.userModel
                .findOne({
                    ...softDeleteCondition,
                    _id,
                })
                .select([...attrs])
                .lean();
        } catch (error) {
            this.logger.error('err in getProfileById');
            throw error;
        }
    }

    async updateProfile(
        _id: ObjectId,
        body: IUpdateProfileBody,
        attrs = profileAttributes,
    ) {
        try {
            await this.userModel.updateOne(
                {
                    ...softDeleteCondition,
                    _id,
                },
                {
                    $set: {
                        ...body,
                        updatedAt: new Date(),
                    },
                },
            );
            return await this.getProfileById(_id, attrs);
        } catch (error) {
            this.logger.error('err in updateProfile');
            throw error;
        }
    }

    async getUserToken(token: string) {
        try {
            const userToken = await await this.userTokenModel.findOne(
                {
                    token,
                    $or: [
                        {
                            deletedAt: {
                                $gte: new Date(),
                            },
                        },
                        { deletedAt: null },
                    ],
                },
                { userId: 1 },
            );
            return userToken;
        } catch (error) {
            this.logger.error('error in get user token');
            throw error;
        }
    }

    async deleteUserToken(tokenId: ObjectId, deletedBy: ObjectId) {
        try {
            await this.userTokenModel.updateOne(
                {
                    _id: tokenId,
                    deletedAt: {
                        $gte: new Date(),
                    },
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            this.logger.error('error in delete user token');
            throw error;
        }
    }

    public async checkExistOtherTokenUnexpired(
        userId: ObjectId,
        token: string,
    ) {
        try {
            const condition = {
                deletedAt: {
                    $gte: new Date(),
                },
                userId: new ObjectId(userId),
                token: {
                    $ne: token,
                },
            };

            const count = await this.userTokenModel.countDocuments({
                ...condition,
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    public async logoutOtherDevice(
        userId: ObjectId,
        token: ILogoutOtherDeviceBody,
    ) {
        try {
            const condition = {
                deletedAt: {
                    $gte: new Date(),
                },
                userId: new ObjectId(userId),
                token: {
                    $ne: token.refreshToken,
                },
            };

            await this.userTokenModel.updateMany(
                { ...condition },
                {
                    deletedAt: new Date(),
                    deletedBy: new ObjectId(userId),
                },
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    public async logout(userId: ObjectId, token: ILogoutBody) {
        try {
            const condition = {
                deletedAt: {
                    $gte: new Date(),
                },
                userId: new ObjectId(userId),
                token: token.refreshToken,
            };

            await this.userTokenModel.updateMany(
                { ...condition },
                {
                    deletedAt: new Date(),
                    deletedBy: new ObjectId(userId),
                },
            );
            return true;
        } catch (error) {
            throw error;
        }
    }
}
