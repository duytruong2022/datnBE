import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection, TEXTAREA_MAX_LENGTH } from 'src/common/constants';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { ObjectId, Types } from 'mongoose';
import { ProjectLogActions, ProjectLogModules } from '../project-log.constant';
export type ProjectLogDocument = ProjectLog & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_LOGS,
})
export class ProjectLog extends BaseSchema {
    @Prop({ required: true, type: Types.ObjectId })
    projectId: ObjectId;

    @Prop({
        require: true,
        type: String,
        enum: Object.values(ProjectLogModules),
    })
    module: ProjectLogModules;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(ProjectLogActions),
    })
    action: ProjectLogActions;

    @Prop({
        required: false,
        type: JSON,
    })
    oldData: Record<string, unknown>;

    @Prop({
        required: false,
        type: JSON,
    })
    newData: Record<string, unknown>;

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    description: string;
}

export const ProjectLogSchema = SchemaFactory.createForClass(ProjectLog);
