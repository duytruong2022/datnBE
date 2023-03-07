import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { SchemaTypes } from 'mongoose';
import { MongoCollection } from 'src/common/constants';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { User } from 'src/modules/user/mongo-schemas/user.schema';
import { ProjectCategoires } from '../project.constant';
export type ProjectDocument = Project & Document;
@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECTS,
})
export class Project extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: String,
        enum: Object.values(ProjectCategoires),
    })
    category: string;

    @Prop({
        type: String,
        trim: true,
        default: '',
    })
    description: string;

    @Prop({
        required: true,
        type: String,
    })
    postalCode: string;

    @Prop({
        required: true,
        type: Number,
    })
    latitude: number;

    @Prop({
        required: true,
        type: Number,
    })
    longitude: number;

    @Prop({
        type: String,
    })
    coordinatesDetails: string;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
    adminId: ObjectId;

    @Prop({ type: Boolean, default: true, required: true })
    displayActivityCode: boolean;

    manager: User;
    admin: User;
}

const BaseProjectSchema = SchemaFactory.createForClass(Project);
BaseProjectSchema.virtual('manager', {
    ref: 'User',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true,
});
BaseProjectSchema.virtual('admin', {
    ref: 'User',
    localField: 'adminId',
    foreignField: '_id',
    justOne: true,
});
export const ProjectSchema = BaseProjectSchema;
