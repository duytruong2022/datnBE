import { AccessModules } from './../../../common/constants';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection } from 'src/common/constants';
import { Document, SchemaTypes, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
export type AccessLogDocument = AccessLog & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.ACCESS_LOGS,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class AccessLog extends BaseSchema {
    @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
    userId: ObjectId;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(AccessModules),
    })
    module: AccessModules;

    @Prop({ required: false, type: SchemaTypes.ObjectId })
    projectId: ObjectId;

    @Prop({ required: false, default: null, type: Date })
    loginAt: Date;

    @Prop({ required: false, default: null, type: Date })
    logoutAt: Date;
}

const BaseAccessLogSchema = SchemaFactory.createForClass(AccessLog);
BaseAccessLogSchema.virtual('userAccess', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});

export const AccessLogSchema = BaseAccessLogSchema;
