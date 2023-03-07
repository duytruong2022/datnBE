import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
import { IBaselineTask } from '../project.interface';
export type BaselinePlanningDocument = BaselinePlanning & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.BASELINE_PLANNINGS,
})
export class BaselinePlanning extends BaseSchema {
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
    planningId: ObjectId;

    @Prop({
        required: false,
        type: JSON,
    })
    baselineTasks: IBaselineTask[];
}

const BaseBaselinePlanningSchema =
    SchemaFactory.createForClass(BaselinePlanning);
export const BaselinePlanningSchema = BaseBaselinePlanningSchema;
