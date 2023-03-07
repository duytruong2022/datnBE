import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Document, Types } from 'mongoose';
import { MongoCollection } from 'src/common/constants';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import {
    CurrencyType,
    LinkType,
    PlanningStatus,
    TaskDuration,
    TaskDurationFormat,
    TaskFieldDataType,
    TaskPercentCompleteType,
    TaskType,
} from '../project.constant';
import { Calendar } from './calendar.schema';
import { Project } from './project.schema';
import { ProjectTask } from './task.schema';

export type PlanningDocument = ProjectPlanning & Document;
export type TaskLinkDocument = TaskLink & Document;

@Schema()
export class TaskLink extends Document {
    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: ProjectTask.name,
    })
    source: ObjectId;
    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: ProjectTask.name,
    })
    target: ObjectId;
    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(LinkType)],
    })
    type: LinkType;
    @Prop({
        required: true,
        type: Number,
        default: 0,
    })
    lag: number;
    @Prop({
        type: Types.ObjectId,
    })
    clonedFromLinkId: ObjectId;
}
const TaskLinkSchema = SchemaFactory.createForClass(TaskLink);

@Schema()
export class AdditionalTaskFields extends Document {
    @Prop({
        required: true,
        type: String,
    })
    name: string;
    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(TaskFieldDataType)],
    })
    dataType: TaskFieldDataType;
}
const AdditionalTaskFieldsSchema =
    SchemaFactory.createForClass(AdditionalTaskFields);
@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_PLANNINGS,
})
export class ProjectPlanning extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        type: String,
        default: PlanningStatus.PLANNED,
        enum: [...Object.values(PlanningStatus)],
    })
    status: PlanningStatus;

    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: Project.name,
    })
    projectId: ObjectId;

    @Prop({
        type: [Types.ObjectId],
        default: [],
    })
    clonedFromPlanningIds: ObjectId[];

    @Prop({
        type: Types.ObjectId,
        default: undefined,
    })
    delegatedFromPlanningId: ObjectId;

    tasks?: ProjectTask[];

    @Prop({
        required: true,
        type: Array(TaskLinkSchema),
        default: [],
    })
    taskLinks: TaskLink[];

    @Prop({
        required: false,
        type: Boolean,
        default: undefined,
    })
    isTemplate?: boolean;

    @Prop({
        required: true,
        type: Array(AdditionalTaskFieldsSchema),
        default: [],
    })
    additionalTaskFields: AdditionalTaskFields[];

    @Prop({
        type: Types.ObjectId || null,
        default: null,
    })
    originalPlanningId: ObjectId;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(CurrencyType)],
    })
    currency: string;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(TaskDuration)],
    })
    durationType: string;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(TaskDurationFormat)],
    })
    durationFormat: string;

    @Prop({
        required: false,
        type: Number,
    })
    defaultDuration: number;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(TaskType)],
    })
    activityType: string;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(TaskPercentCompleteType)],
    })
    percentageCompletion: string;

    @Prop({
        required: false,
        type: Types.ObjectId,
        ref: Calendar.name,
    })
    defaultCalendar: ObjectId;

    @Prop({
        required: false,
        type: Boolean,
        default: true,
    })
    autoScheduling: boolean;
}

export const PlanningSchema = SchemaFactory.createForClass(ProjectPlanning);
PlanningSchema.index(
    {
        'taskLinks.source': 1,
        'taskLinks.target': 1,
        'taskLinks.type': 1,
        _id: 1,
    },
    {
        unique: true,
    },
);

// ensure that planning have unique name in a project in the same directory in ftp server
PlanningSchema.index(
    {
        name: 1,
        planningId: 1,
        planningFilePath: 1,
        projectId: 1,
        deletedAt: 1,
    },
    {
        unique: true,
    },
);
