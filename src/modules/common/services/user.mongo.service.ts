import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import {
    AccessModules,
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    MongoCollection,
    softDeleteCondition,
} from 'src/common/constants';
import { MODULE_NAME } from '../common.constant';
import { IQueryDropdownByModules } from '../common.interface';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import { ObjectId } from 'mongodb';
import { getTotalSkipItem } from 'src/common/helpers/commonFunctions';
import { uniq } from 'lodash';
@Injectable()
export class UserMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );
    public async getUserList(query: IQueryDropdownByModules) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                accessModules = [],
                projectId = '',
            } = query;

            const userList = await this.userModel.aggregate([
                {
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'constellationGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'constellationGroups',
                    },
                },
                {
                    $project: {
                        email: 1,
                        constellationGroupIds: 1,
                        constellationGroups: 1,
                        accessModules: 1,
                        assignedProjectIds: 1,
                        adminProjectIds: 1,
                        lastName: 1,
                        firstName: 1,
                        deletedAt: 1,
                        deletedBy: 1,
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserListQueryBuilder({
                                accessModules,
                                projectId,
                            }),
                        ],
                    },
                },
                { $skip: getTotalSkipItem(page, limit) },
                { $limit: +limit },
            ]);
            return { items: userList };
        } catch (error) {
            this.logger.error('Error in get getUserList function', error);
            throw error;
        }
    }

    async getCompanyList(query: IQueryDropdownByModules) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                accessModules = [],
                projectId = '',
            } = query;
            const userList = await this.userModel.aggregate([
                {
                    $lookup: {
                        from: MongoCollection.GROUPS,
                        localField: 'constellationGroupIds',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'constellationGroups',
                    },
                },
                {
                    $project: {
                        constellationGroupIds: 1,
                        constellationGroups: 1,
                        accessModules: 1,
                        assignedProjectIds: 1,
                        adminProjectIds: 1,
                        company: 1,
                    },
                },
                {
                    $match: {
                        $and: [
                            ...this.generateUserListQueryBuilder({
                                accessModules,
                                projectId,
                            }),
                        ],
                    },
                },
                { $skip: getTotalSkipItem(page, limit) },
                { $limit: +limit },
            ]);
            return { items: uniq(userList.map((item) => item.company)) };
        } catch (error) {
            this.logger.error('Error in get getUserList function', error);
            throw error;
        }
    }

    generateUserListQueryBuilder({ accessModules, projectId }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (
            accessModules?.length &&
            !accessModules.includes(AccessModules.SPACIALYTIC_PLATFORM)
        ) {
            accessModules.push(AccessModules.SPACIALYTIC_PLATFORM);
            conditions.push({
                'accessModules.module': {
                    $in: accessModules,
                },
            });
        }

        if (projectId?.length) {
            conditions.push({
                $or: [
                    { assignedProjectIds: new ObjectId(projectId) },
                    { adminProjectIds: new ObjectId(projectId) },
                    {
                        'constellationGroups.projectIds': new ObjectId(
                            projectId,
                        ),
                    },
                ],
            });
        }
        return conditions;
    }
}
