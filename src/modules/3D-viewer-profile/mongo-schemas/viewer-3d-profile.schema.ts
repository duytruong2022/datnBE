import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    INPUT_TEXT_MAX_LENGTH,
    MongoCollection,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ProjectPermissions } from '../viewer-3d-profile.constant';
export type Viewer3dProfileDocument = Viewer3dProfile & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection['3D_VIEWER_PROFILES'],
})
export class Viewer3dProfile extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: Array(String),
        enum: Object.values(ProjectPermissions),
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
}

export const Viewer3dProfileSchema =
    SchemaFactory.createForClass(Viewer3dProfile);
