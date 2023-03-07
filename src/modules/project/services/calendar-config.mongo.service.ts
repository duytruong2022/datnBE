import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { IConfigDateData, IGetCalendarConfigQuery } from '../project.interface';
import { MongoCollection, softDeleteCondition } from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    CalendarConfig,
    CalendarConfigDocument,
} from '../mongo-schemas/calendar-config.schema';
import moment from 'moment-timezone';
import { ObjectId } from 'mongodb';
import { DayTypes } from '../project.constant';
export const calendarConfigAttributes = [
    'calendarId',
    'date',
    'dayType',
    'linkKey',
    'workingDayTypeId',
];

@Injectable()
export class CalendarConfigMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(CalendarConfig.name)
        private readonly calendarConfigModel: Model<CalendarConfigDocument>,
    ) {}

    private readonly logger = createWinstonLogger(
        'day-type-service',
        this.configService,
    );

    async getCalendarConfigs(query: IGetCalendarConfigQuery) {
        try {
            const { calendarId, startDate, endDate } = query;
            const mongooseQuery = {
                ...softDeleteCondition,
                calendarId,
                $and: [
                    {
                        date: {
                            $gte: moment.tz(startDate, 'UTC').toDate(),
                        },
                    },
                    {
                        date: {
                            $lte: moment.tz(endDate, 'UTC').toDate(),
                        },
                    },
                ],
            };

            const [items, totalItems] = await Promise.all([
                this.calendarConfigModel.aggregate([
                    { $match: mongooseQuery },
                    {
                        $lookup: {
                            from: MongoCollection.PROJECT_CALENDAR_DAY_TYPES,
                            localField: 'workingDayTypeId',
                            foreignField: '_id',
                            as: 'workingDayType',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as unknown as Expression,
                                },
                                {
                                    $project: {
                                        name: 1,
                                        timeBlocks: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: {
                            path: '$workingDayType',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            workingDayType: 1,
                            date: 1,
                        },
                    },
                ]),
                this.calendarConfigModel.countDocuments(mongooseQuery),
            ]);
            return { items, totalItems };
        } catch (error) {
            throw error;
        }
    }

    async setWorkingDays(
        dates: Date[],
        calendarId: ObjectId,
        data: IConfigDateData,
    ) {
        try {
            const mongooseQueries = dates.map((date) => {
                return {
                    updateOne: {
                        filter: {
                            date,
                            calendarId,
                            ...softDeleteCondition,
                        },
                        update: data,
                        upsert: data.dayType === DayTypes.WORKING_DAY,
                    },
                };
            });
            await this.calendarConfigModel.bulkWrite(mongooseQueries);
        } catch (error) {
            throw error;
        }
    }

    async setNoneWorkingDays(
        dates: Date[],
        calendarId: ObjectId,
        deletedBy: ObjectId,
    ) {
        try {
            await this.calendarConfigModel.updateMany(
                {
                    date: {
                        $in: dates,
                    },
                    calendarId,
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async getCalendarConfigById(
        id: ObjectId,
        attrs = calendarConfigAttributes,
    ) {
        try {
            const config = this.calendarConfigModel
                .findOne({
                    _id: id,
                    ...softDeleteCondition,
                })
                .select(attrs);
            return config;
        } catch (error) {
            throw error;
        }
    }
}
