import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
import { ITimeBlock } from '../project.interface';
export type DayTypeDocument = DayType & Document;

@Schema()
export class TimeBlock extends Document {
    @Prop({
        required: true,
        type: String,
    })
    startTime: string;

    @Prop({
        required: true,
        type: String,
    })
    endTime: string;
}
const TimeBlockSchema = SchemaFactory.createForClass(TimeBlock);

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_CALENDAR_DAY_TYPES,
})
export class DayType extends BaseSchema {
    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: Array(TimeBlockSchema),
    })
    timeBlocks: ITimeBlock[];

    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    projectId: ObjectId;
}

export const DayTypeSchema = SchemaFactory.createForClass(DayType);
