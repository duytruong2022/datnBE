import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
export type CalendarDocument = Calendar & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_CALENDARS,
})
export class Calendar extends BaseSchema {
    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    projectId: ObjectId;

    @Prop({
        default: false,
        type: Boolean,
    })
    isDefaultCalendar: boolean;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
