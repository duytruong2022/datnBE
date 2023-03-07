import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { ClientSession, Connection, Model } from 'mongoose';
import {
    AccessModules,
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    Viewer3dProfile,
    Viewer3dProfileDocument,
} from '../mongo-schemas/viewer-3d-profile.schema';
import { profileListAttrubutes } from '../viewer-3d-profile.constant';
import {
    ICreateProfileBody,
    IGetListProfileQueryString,
    IUpdateProfileBody,
} from '../viewer-3d-profile.interface';

@Injectable()
export class ProfileService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Viewer3dProfile.name)
        private readonly profileModel: Model<Viewer3dProfileDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    private readonly logger = createWinstonLogger(
        'profile-service',
        this.configService,
    );

    async getProfileList(
        query: IGetListProfileQueryString,
        attrs = profileListAttrubutes,
    ) {
        try {
            const {
                keyword = '',
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                page = DEFAULT_FIRST_PAGE,
                projectId = '',
                accessModule = AccessModules.SPACIALYTIC_CONSTELLATION,
            } = query;
            const [resultList, count] = await Promise.all([
                this.profileModel
                    .find({
                        ...softDeleteCondition,
                        name: {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                        projectId,
                        accessModule,
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
                this.profileModel.countDocuments({
                    ...softDeleteCondition,
                    name: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                    projectId,
                    accessModule,
                }),
            ]);
            return {
                items: resultList,
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getProfileList', error);
            throw error;
        }
    }

    async checkProfileNameExists(name: string, _id?: ObjectId) {
        try {
            const condition = {
                name: {
                    $regex: `^${name}$`,
                    $options: 'i',
                },
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
            const count = await this.profileModel.count({
                ...condition,
            });
            return count > 0;
        } catch (error) {
            this.logger.error('Error in checkProfileNameExists func', error);
            throw error;
        }
    }

    async createProfile(
        body: ICreateProfileBody,
        attrs = profileListAttrubutes,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const record = new this.profileModel({
                ...body,
            });
            if (body.isDefaultSelect) {
                await this.resetDefaultSelect(record._id, session);
            }
            await record.save();
            await session.commitTransaction();
            return await this.getProfileById(record._id, attrs);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in createProfile', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async resetDefaultSelect(_id: ObjectId, session?: ClientSession) {
        try {
            await this.profileModel.updateMany(
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

    async getProfileById(_id: ObjectId, attrs = profileListAttrubutes) {
        try {
            return await this.profileModel
                .findOne({
                    _id,
                    ...softDeleteCondition,
                })
                .select([...attrs]);
        } catch (error) {
            this.logger.error('Error in getProfileById', error);
            throw error;
        }
    }

    async deleteProfile(_id: ObjectId, deletedBy: ObjectId): Promise<any> {
        try {
            return await this.profileModel.updateOne(
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
            this.logger.error('Error in deleteProfile', error);
            throw error;
        }
    }

    async updateProfile(
        _id: ObjectId,
        body: IUpdateProfileBody,
        attrs = profileListAttrubutes,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            if (body.isDefaultSelect) {
                await this.resetDefaultSelect(_id, session);
            }
            await this.profileModel.updateOne(
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
            return await this.getProfileById(_id, attrs);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in updateProfile', error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}
