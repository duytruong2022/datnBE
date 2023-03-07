import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Document, Types } from 'mongoose';
import { MongoCollection } from 'src/common/constants';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { BaselineColor, BaselinePosition } from '../project.constant';
export type BaselineConfigurationDocument = BaselineConfiguration & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.BASELINE_CONFIGURATIONS,
})
export class BaselineConfiguration extends BaseSchema {
    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    planningId: ObjectId;

    @Prop({
        required: true,
        type: Boolean,
        default: true,
    })
    display: boolean;

    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(BaselinePosition)],
        default: BaselinePosition.AROUND,
    })
    position: string;

    @Prop({
        required: true,
        type: String,
        default: BaselineColor,
    })
    color: string;
}

const BaseBaselineConfigurationSchema = SchemaFactory.createForClass(
    BaselineConfiguration,
);
export const BaselineConfigurationSchema = BaseBaselineConfigurationSchema;
