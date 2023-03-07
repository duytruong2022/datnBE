import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { ClientSession, Connection, Model } from 'mongoose';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    Group,
    GroupDocument,
} from 'src/modules/group/mongo-schemas/group.schema';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import {
    SecurityProfile,
    SecurityProfileDocument,
} from '../mongo-schemas/security-profile.schema';
import { securityProfileListAttributes } from '../security-profile.constant';
import {
    ICreateSecurityProfileBody,
    ISecurityProfileQuery,
    IUpdateSecurityProfleBody,
} from '../security-profile.interface';

@Injectable()
export class SecurityProfileService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(SecurityProfile.name)
        private readonly securityProfileModel: Model<SecurityProfileDocument>,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    private readonly logger = createWinstonLogger(
        'security-profile-service',
        this.configService,
    );

    async getSecurityProfileList(
        query: ISecurityProfileQuery,
        attrs = securityProfileListAttributes,
    ) {
        try {
            const {
                keyword = '',
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                page = DEFAULT_FIRST_PAGE,
            } = query;
            const [resultList, count] = await Promise.all([
                this.securityProfileModel
                    .find({
                        ...softDeleteCondition,
                        name: {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    })
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.DESCENDING
                                ? -1
                                : 1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .select([...attrs]),
                this.securityProfileModel.countDocuments({
                    ...softDeleteCondition,
                    name: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                }),
            ]);
            return {
                items: resultList,
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getSecurityProfileList', error);
            throw error;
        }
    }

    async getSecurityProfileById(
        _id: ObjectId,
        attrs = securityProfileListAttributes,
    ) {
        try {
            return await this.securityProfileModel
                .findOne({
                    _id,
                    ...softDeleteCondition,
                })
                .select([...attrs]);
        } catch (error) {
            this.logger.error('Error in getSecurityProfileById', error);
            throw error;
        }
    }

    async checkSecurityProfileNameExists(name: string, _id?: ObjectId) {
        try {
            const condition = {
                name,
                ...softDeleteCondition,
            };
            if (_id) {
                Object.assign(condition, {
                    ...condition,
                    _id: {
                        $ne: _id,
                    },
                });
            }
            const count = await this.securityProfileModel.count({
                ...condition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error('Error in isSecurityProfileExists func', error);
            throw error;
        }
    }

    async createSecurityProfile(
        body: ICreateSecurityProfileBody,
        attrs = securityProfileListAttributes,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const record = new this.securityProfileModel({
                ...body,
            });
            if (body.isDefaultSelect) {
                await this.resetDefaultSelect(record._id, session);
            }
            await record.save();
            await session.commitTransaction();
            return await this.getSecurityProfileById(record._id, attrs);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in createSecurityProfile', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updateSecurityProfile(
        _id: ObjectId,
        body: IUpdateSecurityProfleBody,
        attrs = securityProfileListAttributes,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            if (body.isDefaultSelect) {
                await this.resetDefaultSelect(_id, session);
            }
            await this.securityProfileModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        ...body,
                        updatedAt: new Date(),
                    },
                },
                {
                    session,
                },
            );
            await session.commitTransaction();
            return await this.getSecurityProfileById(_id, attrs);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in updateSecurityProfile', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async resetDefaultSelect(_id: ObjectId, session?: ClientSession) {
        try {
            await this.securityProfileModel.updateMany(
                {
                    _id: {
                        $ne: _id,
                    },
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        isDefaultSelect: false,
                        updatedAt: new Date(),
                    },
                },
                {
                    session,
                },
            );
        } catch (error) {
            this.logger.error('Error in resetDefaultSelect', error);
            throw error;
        }
    }

    async deleteSecurityProfile(
        _id: ObjectId,
        deletedBy: ObjectId,
    ): Promise<any> {
        try {
            return await this.securityProfileModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy,
                    },
                },
            );
        } catch (error) {
            this.logger.error('Error in deleteSecurityProfile', error);
            throw error;
        }
    }

    async checkSecurityProfileAssignToGroup(_id: ObjectId): Promise<boolean> {
        try {
            const count = await this.groupModel.countDocuments({
                securityProfileId: _id,
                ...softDeleteCondition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkSecurityProfileAssignToGroup',
                error,
            );
            throw error;
        }
    }

    async checkSecurityProfileAssignToUser(_id: ObjectId): Promise<boolean> {
        try {
            const count = await this.userModel.countDocuments({
                securityProfileIds: { $in: [_id] },
                ...softDeleteCondition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkSecurityProfileAssignToUser',
                error,
            );
            throw error;
        }
    }
}
