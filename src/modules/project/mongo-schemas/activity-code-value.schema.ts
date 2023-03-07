import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    INPUT_TEXT_MAX_LENGTH,
    COLOR_CODE_MAX_LENGTH,
    MongoCollection,
} from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { Project } from './project.schema';
import { ObjectId } from 'mongodb';
import { ActivityCode } from './activity-code.schema';

export type ActivityCodeValueDocument = ActivityCodeValue & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.ACTIVITY_CODE_VALUES,
})
export class ActivityCodeValue extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
        default: '',
    })
    description: string;

    @Prop({
        required: true,
        type: String,
        maxLength: COLOR_CODE_MAX_LENGTH,
        trim: true,
    })
    colorCode: string;

    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: Project.name,
    })
    projectId: ObjectId;

    @Prop({
        required: false,
        default: null,
        ref: ActivityCodeValue.name,
        type: ObjectId,
    })
    parentId: ObjectId;

    @Prop({
        type: ObjectId,
        ref: ActivityCode.name,
        required: true,
    })
    activityCodeId: ObjectId;
}

const BaseActivityCodeValueSchema =
    SchemaFactory.createForClass(ActivityCodeValue);
export const ActivityCodeValueSchema = BaseActivityCodeValueSchema;
