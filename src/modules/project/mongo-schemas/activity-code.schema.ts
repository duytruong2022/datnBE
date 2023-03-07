import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from 'src/common/constants';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { Project } from './project.schema';

export type ActivityCodeDocument = ActivityCode & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.ACTIVITY_CODES,
})
export class ActivityCode extends BaseSchema {
    @Prop({
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
        required: true,
    })
    name: string;

    @Prop({
        type: Number,
        required: true,
        default: null,
    })
    maxLength: number;

    @Prop({
        type: ObjectId,
        ref: Project.name,
        required: true,
    })
    projectId: ObjectId;
}

const BaseActivityCodeSchema = SchemaFactory.createForClass(ActivityCode);
export const ActivityCodeSchema = BaseActivityCodeSchema;
