import { DefaultSelectCompanyValue } from './../access-log.constant';
import {
    AccessLog,
    AccessLogDocument,
} from './../mongo-schemas/access-log.schema';
import {
    IAccessLogCreateBody,
    IAccessLogListQuery,
    IAccessLogUpdateBody,
} from '../access-log.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { MODULE_NAME } from '../access-log.constant';
import {
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    INTEGER_POSITIVE_MIN_VALUE,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { ObjectId } from 'mongodb';
import { DEFAULT_PROJECT_PAGE_LIMIT } from 'src/modules/project/project.constant';
const accessLogAttributes = [
    '_id',
    'userAccess',
    'module',
    'loginAt',
    'logoutAt',
];
@Injectable()
export class AccessLogMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(AccessLog.name)
        private readonly accessLogModel: Model<AccessLogDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async createAccessLog(
        accessLog: IAccessLogCreateBody,
    ): Promise<AccessLogDocument> {
        try {
            const record = new this.accessLogModel({
                ...accessLog,
            });
            await record.save();
            return await this.getAccessLogDetail(record._id);
        } catch (error) {
            this.logger.error('Error in createAccessLog service', error);
            throw error;
        }
    }

    async getAccessLogDetail(_id: ObjectId): Promise<AccessLogDocument> {
        try {
            return await this.accessLogModel
                .findOne({ _id, ...softDeleteCondition })
                .select([...accessLogAttributes]);
        } catch (error) {
            this.logger.error('Error in getAccessLogDetail service', error);
            throw error;
        }
    }

    async getAccessLogList(query: IAccessLogListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_PROJECT_PAGE_LIMIT,
                modules = [],
                loginAtRange = [],
                keyword = '',
                orderDirection = DEFAULT_ORDER_DIRECTION,
                orderBy = DEFAULT_ORDER_BY,
            } = query;
            let companies = query?.companies ?? [];

            const mongooseQuery = {
                ...softDeleteCondition,
            };

            if (modules.length) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    module: {
                        $in: modules,
                    },
                });
            }
            if (loginAtRange.length) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    loginAt: {
                        $gte: new Date(loginAtRange[0]),
                        $lte: new Date(loginAtRange[1]),
                    },
                });
            }

            if (keyword) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    'userAccess.email': {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                });
            }

            if (companies.length) {
                if (companies.includes(DefaultSelectCompanyValue.BLANK)) {
                    companies = companies.filter(
                        (item) => item !== DefaultSelectCompanyValue.BLANK,
                    );

                    if (companies.length) {
                        Object.assign(mongooseQuery, {
                            ...mongooseQuery,
                            $or: [
                                {
                                    'userAccess.company': {
                                        $in: companies,
                                    },
                                },
                                {
                                    'userAccess.company': {
                                        $eq: '',
                                    },
                                },
                            ],
                        });
                    } else {
                        Object.assign(mongooseQuery, {
                            ...mongooseQuery,
                            'userAccess.company': {
                                $eq: '',
                            },
                        });
                    }
                } else {
                    Object.assign(mongooseQuery, {
                        ...mongooseQuery,
                        'userAccess.company': {
                            $in: companies,
                        },
                    });
                }
            }

            const [resultList, count] = await Promise.all([
                this.accessLogModel.aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userAccess',
                        },
                    },
                    {
                        $unwind: '$userAccess',
                    },
                    {
                        $match: {
                            $and: [
                                {
                                    ...mongooseQuery,
                                },
                            ] as unknown as Expression[],
                        },
                    },
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.DESCENDING
                                    ? -1
                                    : 1,
                        },
                    },
                    { $skip: limit * (page - 1) },
                    { $limit: +limit },
                ]),

                this.accessLogModel.aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userAccess',
                        },
                    },
                    {
                        $unwind: '$userAccess',
                    },
                    {
                        $match: {
                            $and: [
                                {
                                    ...mongooseQuery,
                                },
                            ] as unknown as Expression[],
                        },
                    },
                    {
                        $group: {
                            _id: 'null',
                            count: {
                                $sum: 1,
                            },
                        },
                    },
                ]),
            ]);

            return {
                items: resultList,
                totalItems: count[0]?.count,
            };
        } catch (error) {
            this.logger.error('Error in getAccessLogList service', error);
            throw error;
        }
    }

    async updateAccessLog(_id: ObjectId, accessLog: IAccessLogUpdateBody) {
        try {
            await this.accessLogModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        ...accessLog,
                        updatedAt: new Date(),
                    },
                },
            );
            return await this.getAccessLogDetail(_id);
        } catch (error) {
            this.logger.error('Error in updateAccessLog service', error);
            throw error;
        }
    }
}
