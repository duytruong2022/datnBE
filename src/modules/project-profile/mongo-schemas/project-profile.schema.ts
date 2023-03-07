import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    INPUT_TEXT_MAX_LENGTH,
    MongoCollection,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ProjectPermissions } from '../project-profile.constant';
import { ObjectId } from 'mongodb';
export type ProjectProfileDocument = ProjectProfile & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_PROFILES,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class ProjectProfile extends BaseSchema {
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
    permissions: ProjectPermissions[];

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    description: string;

    @Prop({
        required: true,
        type: Boolean,
        default: false,
    })
    isDefaultSelect: boolean;

    @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Project' })
    projectId: ObjectId;
}

const BaseProjectProfileSchema = SchemaFactory.createForClass(ProjectProfile);

BaseProjectProfileSchema.virtual('project', {
    ref: 'Project',
    localField: 'projectId',
    foreignField: '_id',
    justOne: true,
});

export const ProjectProfileSchema = BaseProjectProfileSchema;
