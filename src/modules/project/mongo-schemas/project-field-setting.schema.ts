import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection } from 'src/common/constants';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
import { IProjectSettingField } from '../project.interface';
export type ProjectFieldSettingDocument = ProjectFieldSetting & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_FIELD_SETTINGS,
})
export class ProjectFieldSetting extends BaseSchema {
    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    projectId: ObjectId;

    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    userId: ObjectId;

    @Prop({
        required: false,
        type: JSON,
    })
    settings: IProjectSettingField;
}

export const ProjectFieldSettingSchema =
    SchemaFactory.createForClass(ProjectFieldSetting);
