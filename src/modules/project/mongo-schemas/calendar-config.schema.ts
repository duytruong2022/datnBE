import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
import { DayTypes } from '../project.constant';
export type CalendarConfigDocument = CalendarConfig & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_CALENDAR_CONFIGS,
})
export class CalendarConfig extends BaseSchema {
    @Prop({
        type: Date,
        required: true,
    })
    date: Date;

    @Prop({
        required: true,
        type: String,
    })
    linkKey: string;

    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    calendarId: ObjectId;

    @Prop({
        type: Types.ObjectId,
    })
    workingDayTypeId: ObjectId;

    @Prop({
        required: true,
        type: String,
    })
    dayType: DayTypes;
}
export const CalendarConfigSchema =
    SchemaFactory.createForClass(CalendarConfig);
