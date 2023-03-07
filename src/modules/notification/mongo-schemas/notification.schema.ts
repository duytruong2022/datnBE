import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccessModules, MongoCollection } from 'src/common/constants';
import { Document, SchemaTypes, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongoose';
import {
    NotificationStatus,
    NotificationTypes,
} from '../notification.constant';
export type NotificationDocument = Notification & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.NOTIFICATIONS,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class Notification extends BaseSchema {
    @Prop({
        required: true,
        type: [
            {
                type: String,
                enum: AccessModules,
            },
        ],
    })
    accessModules: AccessModules[];

    @Prop({
        type: String,
        enum: Object.values(NotificationTypes),
        required: true,
    })
    type: NotificationTypes;

    @Prop({
        type: String,
        enum: Object.values(NotificationStatus),
        default: NotificationStatus.PENDING,
    })
    status: NotificationStatus;

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
    fromUserId: ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Project' })
    projectId: ObjectId;

    @Prop({
        type: String,
    })
    rejectReason: string;
}

const BaseNotificationSchema = SchemaFactory.createForClass(Notification);

BaseNotificationSchema.virtual('requestedUser', {
    ref: 'User',
    localField: 'fromUserId',
    foreignField: '_id',
    justOne: true,
});

BaseNotificationSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true,
});

BaseNotificationSchema.virtual('updatedUser', {
    ref: 'User',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true,
});

export const NotificationSchema = BaseNotificationSchema;
