import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    INPUT_TEXT_MAX_LENGTH,
    MongoCollection,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { SecurityPermissions } from '../security-profile.constant';
export type SecurityProfileDocument = SecurityProfile & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.SECURITY_PROFILES,
})
export class SecurityProfile extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: JSON,
    })
    permissions: SecurityPermissions[];

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    description: string | null;

    @Prop({
        required: false,
        type: Boolean,
        default: false,
    })
    isDefaultSelect: boolean;
}

export const SecurityProfileSchema =
    SchemaFactory.createForClass(SecurityProfile);
