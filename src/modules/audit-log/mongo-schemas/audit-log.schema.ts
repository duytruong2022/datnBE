import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection, TEXTAREA_MAX_LENGTH } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { AuditLogActions, AuditLogModules } from '../audit-log.constant';
import { ObjectId } from 'mongodb';
export type AuditLogDocument = AuditLog & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.AUDIT_LOGS,
})
export class AuditLog extends BaseSchema {
    @Prop({
        require: true,
        type: String,
        enum: Object.values(AuditLogModules),
    })
    module: AuditLogModules;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(AuditLogActions),
    })
    action: AuditLogActions;

    @Prop({ required: false, type: Types.ObjectId })
    targetObjectId: ObjectId;

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    description: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
