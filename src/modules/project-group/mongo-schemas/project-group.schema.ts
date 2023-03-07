import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    AccessModules,
    INPUT_TEXT_MAX_LENGTH,
    MongoCollection,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId } from 'mongodb';
export type ProjectGroupDocument = ProjectGroup & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_GROUPS,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class ProjectGroup extends BaseSchema {
    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: false,
        type: SchemaTypes.ObjectId,
        ref: 'ProjectProfile',
    })
    projectProfileId: ObjectId;

    @Prop({ required: false, type: SchemaTypes.ObjectId })
    projectId: ObjectId;

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    description: string;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(AccessModules),
    })
    accessModule: AccessModules;
}

const BaseProjectGroupSchema = SchemaFactory.createForClass(ProjectGroup);
BaseProjectGroupSchema.virtual('projectProfile', {
    ref: 'ProjectProfile',
    localField: 'projectProfileId',
    foreignField: '_id',
    justOne: true,
});
export const ProjectGroupSchema = BaseProjectGroupSchema;
