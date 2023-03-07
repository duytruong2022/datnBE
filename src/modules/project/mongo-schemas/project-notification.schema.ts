import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
import { ProjectNotificationType } from '../project.constant';
export type ProjectFieldSettingDocument = ProjectNotification & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_NOTIFICATIONS,
})
export class ProjectNotification extends BaseSchema {
    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    projectId: ObjectId;

    @Prop({
        required: true,
        type: String,
    })
    target: string;

    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(ProjectNotificationType)],
    })
    type: ProjectNotificationType;
}

export const ProjectNotificationSchema =
    SchemaFactory.createForClass(ProjectNotification);
