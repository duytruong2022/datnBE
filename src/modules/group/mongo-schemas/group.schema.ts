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
export type GroupDocument = Group & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.GROUPS,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class Group extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: false,
        type: SchemaTypes.ObjectId,
        ref: 'SecurityProfile',
    })
    securityProfileId: ObjectId;

    @Prop({
        required: false,
        type: SchemaTypes.ObjectId,
        ref: 'Viewer3dProfile',
    })
    viewer3dProfileId: ObjectId;

    @Prop({
        required: true,
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

    @Prop({
        required: false,
        type: [SchemaTypes.ObjectId],
        ref: 'Project',
    })
    projectIds: ObjectId[];
}

const BaseGroupSchema = SchemaFactory.createForClass(Group);
BaseGroupSchema.virtual('securityProfile', {
    ref: 'SecurityProfile',
    localField: 'securityProfileId',
    foreignField: '_id',
    justOne: true,
});

BaseGroupSchema.virtual('viewer3dProfile', {
    ref: 'Viewer3dProfile',
    localField: 'viewer3dProfileId',
    foreignField: '_id',
    justOne: true,
});

BaseGroupSchema.virtual('projects', {
    ref: 'Project',
    localField: 'projectIds',
    foreignField: '_id',
    justOne: false,
});

export const GroupSchema = BaseGroupSchema;
