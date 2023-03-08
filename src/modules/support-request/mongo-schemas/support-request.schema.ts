import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongodb';
import { AccessModules, MongoCollection } from 'src/common/constants';
import { IFile } from 'src/common/interfaces';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import {
    SupportRequestCategory,
    SupportRequestPriority,
} from '../support-request.constant';
export type SupportRequestDocument = SupportRequest & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.SUPPORT_REQUESTS,
})
export class SupportRequest extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        trim: true,
    })
    email: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    firstName: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    lastName: string;

    @Prop({
        required: true,
        type: String,
        trim: true,
        enum: Object.values(SupportRequestCategory),
    })
    category: SupportRequestCategory;

    @Prop({
        required: true,
        type: String,
        trim: true,
        enum: Object.values(SupportRequestPriority),
    })
    priority: SupportRequestPriority;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    version: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    object: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    reference: string;

    @Prop({
        required: false,
        type: String,
        trim: true,
    })
    detail: string;

    @Prop({
        require: true,
        type: String,
        enum: Object.values(AccessModules),
    })
    accessModule: AccessModules;

    @Prop({
        required: false,
        type: JSON,
    })
    file: IFile;
}

const BaseSupportRequestSchema = SchemaFactory.createForClass(SupportRequest);

export const SupportRequestSchema = BaseSupportRequestSchema;
