import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Document, SchemaTypes, Types } from 'mongoose';
import { MongoCollection } from 'src/common/constants';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import {
    MilestoneLinkTo,
    MilestoneType,
    TaskConstraint,
    TaskDuration,
    TaskPercentCompleteType,
    TaskPhysicalQuantityUnit,
    TaskStatus,
    TaskType,
} from '../project.constant';
export type TaskDocument = ProjectTask & Document;
@Schema({
    timestamps: true,
    collection: MongoCollection.PROJECT_TASKS,
})
export class ProjectTask extends BaseSchema {
    // name must be unique with other when they have the same parent
    @Prop({
        required: true,
        type: String,
        trim: true,
        unique: false,
    })
    name: string;

    @Prop({
        required: false,
        type: String,
        default: null,
    })
    ganttId: string | null;

    @Prop({
        required: false,
        ref: ProjectTask.name,
        type: Types.ObjectId,
        default: null,
    })
    parentId: ObjectId | null;

    @Prop({
        required: false,
        type: String,
        default: null,
    })
    parentGanttId: string | null;

    @Prop({
        required: true,
        type: Types.ObjectId,
    })
    planningId: ObjectId;

    @Prop({
        required: false,
        type: Types.ObjectId,
        default: null,
    })
    delegatedTo: ObjectId | null;

    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(TaskType)],
        default: TaskType.STANDARD,
    })
    taskType: TaskType;

    @Prop({
        required: true,
        type: String,
        enum: [...Object.values(TaskStatus)],
        default: TaskStatus.TODO,
    })
    status: TaskStatus;

    @Prop({
        type: Date,
        default: null,
    })
    start: Date;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    actualStart: Date | null;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    plannedStart: Date | null;

    @Prop({
        required: false,
        type: Date || null,
        default: null,
    })
    baselineStart: Date | null;

    @Prop({
        type: Date,
        default: null,
    })
    finish: Date;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    actualFinish: Date | null;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    plannedFinish: Date | null;

    @Prop({
        required: false,
        type: Date || null,
        default: null,
    })
    baselineFinish: Date | null;

    @Prop({
        required: false,
        type: String,
        enum: [...Object.values(TaskConstraint), null],
        default: null,
    })
    primaryConstraints: TaskConstraint | null;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    primaryConstraintDate: Date | null;

    @Prop({
        required: false,
        type: Date,
        default: null,
    })
    expectedFinish: Date | null;

    @Prop({
        required: false,
        type: String,
        enum: [null, ...Object.values(TaskDuration)],
        default: null,
    })
    durationType: TaskDuration | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    originalDuration: number | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    actualDuration: number | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    plannedDuration: number | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    remainingDuration: number | null;

    @Prop({
        required: false,
        type: String,
        enum: [null, ...Object.values(TaskPercentCompleteType)],
        default: null,
    })
    percentageCompletion: TaskPercentCompleteType | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    manualComplete: number;

    @Prop({
        required: false,
        type: String,
        enum: [null, ...Object.values(TaskPhysicalQuantityUnit)],
        default: null,
    })
    physicalQuantityUnit: TaskPhysicalQuantityUnit;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    physicalQuantity: number | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    actualPhysicalQuantity: number | null;

    @Prop({
        required: false,
        type: Number,
        default: null,
    })
    rules: number | null;

    @Prop({
        type: Boolean,
        default: false,
    })
    isStaticMilestone: boolean;

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    linkedTaskId: ObjectId; // specify which task does this milestone linked to

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    synthesizedFromTaskId: ObjectId;

    @Prop({
        required: false,
        type: String,
        enum: [null, ...Object.values(MilestoneType)],
        default: null,
    })
    milestoneType: MilestoneType;

    @Prop({
        required: false,
        type: String,
        enum: [null, ...Object.values(MilestoneLinkTo)],
        default: null,
    })
    milestoneLinkTo: MilestoneLinkTo; // specify which to update the milestone (when updating task's start or finish)

    @Prop({
        required: false,
        type: Boolean,
        default: false,
    })
    isMilestoneFolder: boolean;

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    inheritedFromTaskId: ObjectId; // specify which task in planning N it should clone when updating

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    resourceIds?: ObjectId[];

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    resourceGroupIds?: ObjectId[];

    @Prop({ required: false, type: Types.ObjectId, default: null })
    activityCodeValueId: ObjectId | null;

    @Prop({
        required: false,
        type: Boolean,
        default: true,
    })
    canEdit: boolean;

    @Prop({
        required: false,
        type: JSON,
        default: {},
    })
    additionalFields: Record<string, string | number | boolean | Date>;

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    clonedFromTaskId: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    appearanceProfileId: ObjectId;

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    linkedLinkId: ObjectId; // if it is a milestone then it should be linked to a link

    @Prop({
        required: false,
        type: Types.ObjectId,
    })
    calendarId: ObjectId;

    @Prop({
        required: false,
        type: Boolean,
        default: false,
    })
    isSynthesizedToOtherTask: boolean;

    @Prop({
        type: String,
        default: null,
    })
    color: string;

    delegatedToTask: TaskDocument;
    calendarName: string;
}

export const TaskSchema = SchemaFactory.createForClass(ProjectTask);

// ensure that a task in the same parent in a planning cannot have same name
TaskSchema.index(
    {
        name: 1,
        ganttId: 1,
        parentId: 1,
        planningId: 1,
        deletedAt: 1,
    },
    {
        unique: false,
    },
);
