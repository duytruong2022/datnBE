import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
    DayTypeListQuery,
    ICreateDayType,
    IUpdateDayType,
} from '../project.interface';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    softDeleteCondition,
} from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ObjectId } from 'mongodb';
import { DayType, DayTypeDocument } from '../mongo-schemas/day-type.schema';
import {
    CalendarConfig,
    CalendarConfigDocument,
} from '../mongo-schemas/calendar-config.schema';
export const dayTypeAttributes = ['name', 'timeBlocks'];

@Injectable()
export class DayTypeMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(DayType.name)
        private readonly dayTypeModel: Model<DayTypeDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        @InjectModel(CalendarConfig.name)
        private readonly calendarConfigModel: Model<CalendarConfigDocument>,
    ) {}

    private readonly logger = createWinstonLogger(
        'day-type-service',
        this.configService,
    );

    async getDayTypeList(query: DayTypeListQuery) {
        try {
            const {
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                page = DEFAULT_FIRST_PAGE,
                projectId,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
            } = query;
            const [items, totalItems] = await Promise.all([
                this.dayTypeModel
                    .find({
                        ...softDeleteCondition,
                        projectId: new ObjectId(projectId),
                    })
                    .select(dayTypeAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ [orderBy]: orderDirection })
                    .lean(),
                this.dayTypeModel.countDocuments({
                    ...softDeleteCondition,
                    projectId: new ObjectId(projectId),
                }),
            ]);
            return { items, totalItems };
        } catch (error) {
            throw error;
        }
    }

    async getDayTypeById(id: ObjectId) {
        try {
            const dayType = await this.dayTypeModel
                .findOne({
                    ...softDeleteCondition,
                    _id: id,
                })
                .select(dayTypeAttributes);
            return dayType;
        } catch (error) {
            throw error;
        }
    }

    async createDayType(data: ICreateDayType) {
        try {
            const dayType = new this.dayTypeModel(data);
            await dayType.save();
            return await this.getDayTypeById(dayType._id);
        } catch (error) {
            throw error;
        }
    }

    async updateDayType(id: ObjectId, data: IUpdateDayType) {
        try {
            await this.dayTypeModel.updateOne({ _id: id }, data);
            return await this.getDayTypeById(id);
        } catch (error) {
            throw error;
        }
    }

    async deleteDayType(id: ObjectId, deletedBy: ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.dayTypeModel.updateOne(
                { _id: id },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                {
                    session,
                },
            );
            await this.calendarConfigModel.updateMany(
                {
                    workingDayTypeId: id,
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                {
                    session,
                },
            );
            await session.commitTransaction();
        } catch (error) {
            session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
