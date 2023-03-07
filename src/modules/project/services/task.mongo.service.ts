import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { uniq } from 'lodash';
import groupBy from 'lodash/groupBy';
import moment from 'moment';
import {
    AnyBulkWriteOperation,
    ClientSession,
    Document,
    ObjectId,
} from 'mongodb';
import { Connection, Expression, Model } from 'mongoose';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { MongoCollection, softDeleteCondition } from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    PlanningDocument,
    ProjectPlanning,
} from '../mongo-schemas/planning.schema';
import { Project, ProjectDocument } from '../mongo-schemas/project.schema';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import {
    LinkType,
    MilestoneColor,
    MilestoneLinkTo,
    MilestoneLinkToOption,
    MilestoneType,
    PlanningStatus,
    TaskConstraint,
    taskListAttributes,
    TaskStatus,
    TaskType,
} from '../project.constant';
import {
    IBulkUpdateTask,
    ICreateTaskBody,
    IUpdateMilestone,
    IUpdateTaskBody,
} from '../project.interface';

@Injectable()
export class TaskMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<PlanningDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    private readonly logger = createWinstonLogger(
        'project-task-service',
        this.configService,
    );

    async checkTaskIdExists(_id: ObjectId) {
        try {
            return (
                (await this.taskModel.count({
                    _id,
                    ...softDeleteCondition,
                })) > 0
            );
        } catch (error) {
            this.logger.error('Error in checkTaskIdExists func', error);
            throw error;
        }
    }

    async getNumberOfTaskSiblings(parentId: ObjectId) {
        try {
            return await this.taskModel.count({
                ...softDeleteCondition,
                parentId,
            });
        } catch (error) {
            this.logger.error('Error in getNumberOfTaskSiblings func', error);
            throw error;
        }
    }

    async updateStatusPlanning(
        taskId: ObjectId,
        newTaskStatus: TaskStatus,
        session?: ClientSession,
    ) {
        try {
            const task = await this.taskModel.findOne({
                _id: taskId,
                ...softDeleteCondition,
            });
            if (!task || task.status === newTaskStatus) {
                return;
            }

            const countEachStatus = await this.taskModel
                .aggregate([
                    {
                        $match: {
                            planningId: new ObjectId(
                                task.planningId,
                            ) as unknown as Expression,
                            ...(softDeleteCondition as unknown as Record<
                                string,
                                Expression
                            >),
                        },
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $count: {} },
                        },
                    },
                ])
                .option({
                    session,
                });

            let newStatus = PlanningStatus.ACTIVE;
            if (
                countEachStatus.length === 1 &&
                countEachStatus[0]._id !== TaskStatus.IN_PROGRESS
            ) {
                newStatus =
                    countEachStatus[0]._id === TaskStatus.TODO
                        ? PlanningStatus.PLANNED
                        : PlanningStatus.INACTIVE;
            }

            await this.planningModel.updateOne(
                {
                    _id: task.planningId,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        status: newStatus,
                    },
                },
                {
                    session,
                },
            );
        } catch (error) {
            this.logger.error('Error in updateStatusPlanning func', error);
            throw error;
        }
    }

    async createTask(body: ICreateTaskBody) {
        const session = await this.connection.startSession();
        try {
            switch (body.status) {
                case TaskStatus.TODO: {
                    body.plannedStart = body.start;
                    body.plannedFinish = body.finish;
                    break;
                }
                case TaskStatus.IN_PROGRESS: {
                    body.actualStart = body.start;
                    body.plannedFinish = body.finish;
                }
                case TaskStatus.FINISHED: {
                    body.actualStart = body.start;
                    body.actualFinish = body.finish;
                }
            }

            session.startTransaction();
            const planning = await this.planningModel.findOne(
                {
                    _id: body.planningId,
                    ...softDeleteCondition,
                },
                {},
                {
                    session,
                },
            );
            const currentTasks = await this.taskModel
                .find(
                    {
                        planningId: body.planningId,
                    },
                    { ganttId: 1 },
                    {
                        session,
                    },
                )
                .lean();

            const preservedGanttId = new Map<string, boolean>();
            currentTasks.forEach((task) =>
                preservedGanttId.set(task.ganttId, true),
            );
            await planning.save({ session });
            const entity = new this.taskModel({
                ...body,
                parentId: body.parentId ? new ObjectId(body.parentId) : null,
                createdBy: new ObjectId(body.createdBy),
                updatedBy: new ObjectId(body.createdBy),
            });

            let result;
            if (!body.parentId) {
                result = await entity.save();
            } else {
                result = await entity.save({ session });
                // ensure the parent task is wbs_summary
                await this.taskModel.updateOne(
                    {
                        _id: body.parentId,
                        ...softDeleteCondition,
                    },
                    {
                        $set: {
                            taskType: TaskType.WBS_SUMMARY,
                        },
                    },
                    {
                        session,
                    },
                );
            }

            await session.commitTransaction();
            return await this.getTaskById(result._id);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in createTask func', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async bulkCreateTask(tasks: ICreateTaskBody[]) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const dataGroupedByPlanningId = groupBy(
                tasks,
                (task: ICreateTaskBody) => task?.planningId?.toString(),
            );
            const tasksToBeInserted = [];
            const updatePlanningQueries = [];
            const plannings = await this.planningModel.find(
                {
                    _id: {
                        $in: Object.keys(dataGroupedByPlanningId).map(
                            (id) => new ObjectId(id),
                        ),
                    },
                },
                {},
                {
                    session,
                },
            );
            const mapPlanningToId = new Map<string, ProjectPlanning>();
            plannings.forEach((planning) => {
                mapPlanningToId.set(planning._id.toString(), planning);
            });

            Object.keys(dataGroupedByPlanningId).forEach((planningIdString) => {
                const planning = mapPlanningToId.get(planningIdString);
                let taskIdCounterIncrease = 0;
                dataGroupedByPlanningId[planningIdString].forEach((task) => {
                    if (!task.ganttId) {
                        ++taskIdCounterIncrease;
                    }
                    tasksToBeInserted.push({
                        ...task,
                    });
                });
                updatePlanningQueries.push({
                    updateOne: {
                        filter: {
                            _id: planning._id,
                            ...softDeleteCondition,
                        },
                        update: {
                            $inc: {
                                taskIdCounter: taskIdCounterIncrease,
                            },
                        },
                    },
                });
            });

            await this.planningModel.bulkWrite(updatePlanningQueries, {
                session,
            });
            const insertedTasks = await this.taskModel.insertMany(
                tasksToBeInserted,
                { session },
            );
            await session.commitTransaction();
            return await this.getTaskByIds(
                insertedTasks.map((task) => new ObjectId(task._id)),
            );
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in bulkCreateTask func', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getTaskById(
        _id: ObjectId,
        attrs = [...taskListAttributes],
        session: ClientSession = null,
    ) {
        try {
            return await this.taskModel
                .findOne(
                    {
                        _id,
                        ...softDeleteCondition,
                    },
                    {},
                    { session },
                )
                .select(attrs)
                .lean();
        } catch (error) {
            this.logger.error('Error in getTaskById func', error);
            throw error;
        }
    }

    async updateTask(
        _id: ObjectId,
        body: IUpdateTaskBody,
        session: ClientSession = null,
    ) {
        let shouldCommitTransaction = false;
        if (!session) {
            session = await this.connection.startSession();
            session.startTransaction();
            shouldCommitTransaction = true;
        }
        try {
            switch (body.status) {
                case TaskStatus.TODO:
                    body.plannedStart = body.start;
                    body.plannedFinish = body.finish;
                    break;
                case TaskStatus.IN_PROGRESS:
                    body.actualStart = body.start;
                    body.plannedFinish = body.finish;
                    break;
                case TaskStatus.FINISHED:
                    body.actualStart = body.start;
                    body.actualFinish = body.finish;
                    break;
            }
            if (body.parentId) {
                body.parentId = new ObjectId(body.parentId);
            }

            await this.taskModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    ...body,
                    updatedBy: new ObjectId(body.updatedBy),
                },
                {
                    session,
                },
            );

            await this.updateStatusPlanning(_id, body.status, session);

            const updatedTask = await this.taskModel
                .findOne(
                    {
                        _id,
                        ...softDeleteCondition,
                    },
                    {},
                    {
                        session,
                    },
                )
                .select(taskListAttributes)
                .lean();
            if (shouldCommitTransaction) {
                await session.commitTransaction();
            }
            return updatedTask;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in updateTask func', error);
            throw error;
        } finally {
            if (shouldCommitTransaction) {
                session.endSession();
            }
        }
    }

    // delete task recursively, from parent to all children
    async deleteTask(
        planningId: ObjectId,
        rootTaskId: ObjectId,
        deletedBy: ObjectId,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const tree = await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $eq: rootTaskId,
                        } as unknown as Expression,
                    },
                },
                {
                    $graphLookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        startWith: '$_id',
                        connectFromField: '_id',
                        connectToField: 'parentId',
                        as: 'children',
                    },
                },
            ]);
            const taskIdNeedToDelete = [(tree as TaskDocument[])[0]._id];
            (tree[0].children as TaskDocument[])?.forEach((item) => {
                taskIdNeedToDelete.push(item._id);
            });

            const linkedMilestones = await this.taskModel.find({
                linkedTaskId: {
                    $in: taskIdNeedToDelete,
                },
            });
            const linkedMilestoneIds = linkedMilestones.map(
                (milestone) => milestone._id,
            );

            // soft delete task
            await this.taskModel.updateMany(
                {
                    _id: {
                        $in: [...taskIdNeedToDelete, ...linkedMilestoneIds],
                    },
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy,
                    },
                },
                {
                    session,
                },
            );
            // permantly delete link in planning
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                },
                {
                    $pull: {
                        taskLinks: {
                            $or: [
                                {
                                    source: {
                                        $in: [
                                            ...taskIdNeedToDelete,
                                            ...linkedMilestoneIds,
                                        ],
                                    },
                                },
                                {
                                    target: {
                                        $in: [
                                            ...taskIdNeedToDelete,
                                            ...linkedMilestoneIds,
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    session,
                },
            );

            // set 'delegatedTo' field of task which is created by deleted tasks above to null
            await this.taskModel.updateMany(
                {
                    delegatedTo: {
                        $in: taskIdNeedToDelete,
                    },
                    ...softDeleteCondition,
                },
                {
                    $set: { delegatedTo: null },
                },
                { session },
            );
            await session.commitTransaction();
            return [...taskIdNeedToDelete, ...linkedMilestoneIds];
        } catch (error) {
            session.abortTransaction();
            this.logger.error('Error in deleteTask func', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getTaskByIds(ids: ObjectId[], planningIds: ObjectId[] = []) {
        try {
            const subQuery = {};
            if (planningIds.length) {
                Object.assign(subQuery, {
                    'synthesizedFromTask.planningId': {
                        $in: planningIds,
                    },
                });
            }
            return await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: ids,
                        },
                        ...softDeleteCondition,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'synthesizedFromTaskId',
                        foreignField: '_id',
                        as: 'synthesizedFromTask',
                    },
                },
                {
                    $unwind: {
                        path: '$synthesizedFromTask',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: subQuery as unknown as Expression,
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getTaskByIds func', error);
            throw error;
        }
    }

    async getTaskCloned2LevelsFrom(
        ids: ObjectId[],
        planningIds: ObjectId[] = [],
    ) {
        try {
            const subQuery = {};
            if (planningIds.length) {
                Object.assign(subQuery, {
                    'clonedFromTaskLevel2.planningId': {
                        $in: planningIds,
                    },
                });
            }
            return await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: ids,
                        },
                        ...softDeleteCondition,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'clonedFromTaskId',
                        foreignField: '_id',
                        as: 'clonedFromTaskLevel1',
                        pipeline: [
                            {
                                $project: {
                                    clonedFromTaskId: 1,
                                    planningId: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$clonedFromTaskLevel1',
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_PLANNINGS,
                        localField: 'clonedFromTaskLevel1.planningId',
                        foreignField: '_id',
                        as: 'synthesizedFromPlanning',
                    },
                },
                {
                    $unwind: {
                        path: '$synthesizedFromPlanning',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'clonedFromTaskLevel1.clonedFromTaskId',
                        foreignField: '_id',
                        as: 'clonedFromTaskLevel2',
                    },
                },
                {
                    $unwind: {
                        path: '$clonedFromTaskLevel2',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: subQuery as unknown as Expression,
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getTaskCloned2LevelsFrom func', error);
            throw error;
        }
    }

    async checkAllTaskIdsExist(ids: ObjectId[]) {
        try {
            const count = await this.taskModel.countDocuments({
                _id: {
                    $in: ids,
                },
                ...softDeleteCondition,
            });
            return count === ids.length;
        } catch (error) {
            this.logger.error('Error in checkAllTaskIdsExist func', error);
            throw error;
        }
    }

    async checkAllTaskIdsExistInProject(ids: ObjectId[], projectId: ObjectId) {
        try {
            const planningList = await this.planningModel
                .find({
                    projectId,
                    ...softDeleteCondition,
                })
                .select(['_id']);
            const planningIdList = planningList.map((item) => item._id);
            const count = await this.taskModel.countDocuments({
                _id: {
                    $in: ids,
                },
                planningId: {
                    $in: planningIdList,
                },
                ...softDeleteCondition,
            });
            return count === ids.length;
        } catch (error) {
            this.logger.error('Error in checkAllTaskIdsExist func', error);
            throw error;
        }
    }

    async getTaskByIdsAndLean(ids: ObjectId[]) {
        try {
            return await this.taskModel
                .find({
                    _id: {
                        $in: ids,
                    },
                    ...softDeleteCondition,
                })
                .lean();
        } catch (error) {
            this.logger.error('Error in getTaskByIdsAndLean func', error);
            throw error;
        }
    }

    async insertBulkTasks(tasks: IUpdateTaskBody[]) {
        try {
            await this.taskModel.insertMany(tasks);
        } catch (error) {
            this.logger.error('Error in insertBulkTasks func', error);
            throw error;
        }
    }

    async getMilestoneFolder(
        planningId: ObjectId,
        milestoneType: MilestoneType,
    ) {
        try {
            return await this.taskModel
                .findOne({
                    planningId,
                    isMilestoneFolder: true,
                    milestoneType,
                    ...softDeleteCondition,
                })
                .lean();
        } catch (error) {
            this.logger.error('Error in getMilestoneFolder func', error);
            throw error;
        }
    }

    async getMilestoneFolders(
        planningIds: ObjectId[],
        milestoneType: MilestoneType,
    ) {
        try {
            return await this.taskModel.find({
                planningId: {
                    $in: planningIds,
                },
                isMilestoneFolder: true,
                milestoneType,
                ...softDeleteCondition,
            });
        } catch (error) {
            this.logger.error('Error in getTopDownFolders func', error);
            throw error;
        }
    }

    async createTopDownFolder(planningId: ObjectId) {
        try {
            return await this.taskModel
                .findOne({
                    planningId,
                    isTopDownFolder: true,
                    ...softDeleteCondition,
                })
                .lean();
        } catch (error) {
            this.logger.error('Error in createTopDownFolder func', error);
            throw error;
        }
    }

    async countChildrenTaskByIds(taskIds: ObjectId[]) {
        try {
            return await this.taskModel.countDocuments({
                parentId: {
                    $in: taskIds,
                },
                ...softDeleteCondition,
            });
        } catch (error) {
            this.logger.error('Error in countChildrenTaskByIds func', error);
            throw error;
        }
    }

    async updateMilestonesByIds(taskIds: ObjectId[], data: IUpdateMilestone) {
        try {
            return await this.taskModel.updateMany(
                {
                    _id: {
                        $in: taskIds,
                    },
                    taskType: [
                        TaskType.START_MILESTONE,
                        TaskType.FINISH_MILESTONE,
                    ],
                    isStaticMilestone: false,
                    ...softDeleteCondition,
                },
                {
                    ...data,
                },
            );
        } catch (error) {
            this.logger.error('Error in updateMilestonesByIds func', error);
            throw error;
        }
    }

    async getRelatedTasksLinkedTo(
        linkedTaskId: ObjectId,
        milestoneLinkTo: MilestoneLinkTo,
        attrs = [...taskListAttributes],
    ) {
        try {
            const tasks = await this.taskModel
                .find({ linkedTaskId, milestoneLinkTo })
                .select(attrs)
                .lean();
            return tasks;
        } catch (error) {
            this.logger.error('Error in getRelatedTasksLinkedTo func', error);
            throw error;
        }
    }

    async getRelatedTasks(
        linkedTaskId: ObjectId,
        attrs = [...taskListAttributes],
    ) {
        try {
            const tasks = await this.taskModel
                .find({ linkedTaskId })
                .select(attrs)
                .lean();
            return tasks;
        } catch (error) {
            this.logger.error('Error in getRelatedTasks func', error);
            throw error;
        }
    }

    async getAllRelatedTasks(
        linkedLinkIds: ObjectId[],
        milestoneType: MilestoneType,
    ) {
        try {
            const tasks = await this.taskModel
                .find({
                    ...softDeleteCondition,
                    linkedLinkId: {
                        $in: linkedLinkIds,
                    },
                    milestoneType,
                })
                .lean();
            return tasks;
        } catch (error) {
            this.logger.error('Error in getAllRelatedTasks func', error);
            throw error;
        }
    }

    async deleteTaskByLinkedTaskId(
        linkedTaskId: ObjectId,
        deletedBy: ObjectId,
    ) {
        try {
            await Promise.all([
                this.planningModel.updateOne(
                    {
                        ...softDeleteCondition,
                    },
                    {
                        $pull: {
                            taskLinks: {
                                $or: [
                                    {
                                        source: linkedTaskId,
                                    },
                                    {
                                        target: linkedTaskId,
                                    },
                                ],
                            },
                        },
                    },
                ),
                this.taskModel.updateMany(
                    { linkedTaskId, ...softDeleteCondition },
                    {
                        deletedAt: new Date(),
                        deletedBy,
                    },
                ),
            ]);
        } catch (error) {
            this.logger.error('Error in deleteTaskByLinkedTaskId func', error);
            throw error;
        }
    }

    async getTaskByLinkedTaskId(
        linkedTaskId: ObjectId,
        attrs = [...taskListAttributes],
    ) {
        try {
            return await this.taskModel
                .find({
                    linkedTaskId,
                    ...softDeleteCondition,
                })
                .select(attrs)
                .lean();
        } catch (error) {
            this.logger.error('Error in getTaskByLinkedTaskId func', error);
            throw error;
        }
    }

    async getLinkedAndRelatedMilestones(
        taskId: ObjectId,
        attrs = [...taskListAttributes],
    ) {
        try {
            return await this.taskModel
                .find({
                    ...softDeleteCondition,
                    taskType: [
                        TaskType.START_MILESTONE,
                        TaskType.FINISH_MILESTONE,
                    ],
                    isStaticMilestone: false,
                    milestoneLinkTo: {
                        $ne: null,
                    },
                    $or: [
                        {
                            linkedTaskId: taskId,
                        },
                        {
                            inheritedFromTaskId: taskId,
                        },
                    ],
                })
                .select(attrs)
                .lean();
        } catch (error) {
            this.logger.error('Error in getLinkedAndRelatedTasks func', error);
            throw error;
        }
    }

    async bulkUpdateTasks(tasks: IBulkUpdateTask[]) {
        try {
            const updateTaskQueries = tasks.map((task) => {
                const updateData = { ...task };
                delete updateData.taskId;
                if (updateData?.parentId) {
                    updateData.parentId = new ObjectId(updateData.parentId);
                }
                return {
                    updateOne: {
                        filter: {
                            _id: task.taskId,
                            ...softDeleteCondition,
                        },
                        update: {
                            ...updateData,
                        },
                    },
                };
            });

            const taskIds = tasks.map((task) => {
                return new ObjectId(task.taskId);
            });

            await this.taskModel.bulkWrite([...updateTaskQueries]);

            return this.taskModel
                .find({
                    ...softDeleteCondition,
                    _id: {
                        $in: [...taskIds],
                    },
                })
                .select(taskListAttributes)
                .lean();
        } catch (error) {
            this.logger.error('Error in batchUpdateTasks func', error);
            throw error;
        }
    }

    async resetBaseline(taskIds: ObjectId[]) {
        try {
            await this.taskModel.updateMany(
                {
                    _id: { $in: taskIds },
                },
                {
                    baselineStart: null,
                    baselineFinish: null,
                },
            );
        } catch (error) {
            this.logger.error('Error in resetBaseline func', error);
            throw error;
        }
    }

    async traceTaskForTopDown(taskIds: ObjectId[], planningIds: ObjectId[]) {
        try {
            const subQuery = {};
            if (planningIds.length) {
                Object.assign(subQuery, {
                    'clonedFromTask.planningId': {
                        $in: planningIds,
                    },
                });
            }
            const tasks = await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: taskIds,
                        } as unknown as Expression,
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'clonedFromTaskId',
                        foreignField: '_id',
                        as: 'clonedFromTask',
                    },
                },
                {
                    $unwind: '$clonedFromTask',
                },
                {
                    $match: subQuery as unknown as Expression,
                },
            ]);
            return tasks;
        } catch (error) {
            this.logger.error('Error in traceTaskForTopDown func', error);
            throw error;
        }
    }

    async countAllTaskInProject(projectId: ObjectId) {
        try {
            const taskCount = await this.planningModel.aggregate([
                {
                    $match: {
                        ...softDeleteCondition,
                        projectId,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: '_id',
                        foreignField: 'planningId',
                        as: 'task',
                    },
                },
                {
                    $unwind: '$task',
                },
                {
                    $group: {
                        _id: null,
                        cnt: {
                            $sum: 1,
                        },
                    },
                },
            ]);
            return taskCount?.[0]?.cnt || 0;
        } catch (error) {
            this.logger.error('Error in countAllTaskInProject func', error);
            throw error;
        }
    }

    async checkIfTasksAreDelegatedFromTheSamePlanning(taskIds: ObjectId[]) {
        try {
            const count = await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: taskIds,
                        },
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'synthesizedFromTaskId',
                        foreignField: '_id',
                        as: 'synthesizedFromTask',
                    },
                },
                {
                    $unwind: {
                        path: '$synthesizedFromTask',
                    },
                },
                {
                    $group: {
                        _id: '$synthesizedFromTask.planningId',
                    },
                },
            ]);
            return count.length === 1;
        } catch (error) {
            this.logger.error(
                'Error in checkIfTasksAreDelegatedFromTheSamePlanning func',
                error,
            );
            throw error;
        }
    }
    async countTaskGroupByStatus(projectId: ObjectId) {
        try {
            const taskCount = await this.planningModel.aggregate([
                {
                    $match: {
                        ...softDeleteCondition,
                        projectId,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: '_id',
                        foreignField: 'planningId',
                        as: 'task',
                    },
                },
                {
                    $unwind: '$task',
                },
                {
                    $group: {
                        _id: '$task.status',
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $project: {
                        status: '$_id',
                        count: 1,
                    },
                },
            ]);
            return taskCount.reduce((result, task) => {
                Object.assign(result, {
                    ...result,
                    [task.status]: task.count,
                });
                return result;
            }, {});
        } catch (error) {
            this.logger.error('Error in countTaskGroupByStatus func', error);
            throw error;
        }
    }
    async getSynthesizedFromDelegatedPlanning(taskIds: ObjectId[]) {
        try {
            const count = await this.taskModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: taskIds,
                        },
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'synthesizedFromTaskId',
                        foreignField: '_id',
                        as: 'synthesizedFromTask',
                    },
                },
                {
                    $unwind: '$synthesizedFromTask',
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_PLANNINGS,
                        localField: 'synthesizedFromTask.planningId',
                        foreignField: '_id',
                        as: 'synthesizedFromPlanning',
                    },
                },
                {
                    $unwind: {
                        path: '$synthesizedFromPlanning',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        'synthesizedFromTask.planningId': 1,
                        'synthesizedFromTask._id': 1,
                        'synthesizedFromPlanning.planningId': 1,
                    },
                },
            ]);
            return count;
        } catch (error) {
            this.logger.error(
                'Error in getSynthesizedFromDelegatedPlanning func',
                error,
            );
            throw error;
        }
    }
    async getTasksByLinkedLinkIds(
        linkedLinkIds: ObjectId[],
        milestoneType: MilestoneType,
    ) {
        try {
            const tasks = await this.taskModel
                .find({
                    linkedLinkId: {
                        $in: linkedLinkIds,
                    },
                    milestoneType,
                    ...softDeleteCondition,
                })
                .select(taskListAttributes);
            return tasks;
        } catch (error) {
            this.logger.error('Error in getTasksByLinkedLinkIds func', error);
            throw error;
        }
    }

    async checkTaskGanttIdExistInProject(
        ganttId: string,
        projectId: ObjectId,
        id?: ObjectId,
    ) {
        try {
            const planningList = await this.planningModel
                .find({
                    projectId,
                    ...softDeleteCondition,
                })
                .select(['_id']);
            const planningIdList = planningList.map((item) => item._id);
            const conditions = {
                ganttId,
                planningId: {
                    $in: planningIdList,
                },
                ...softDeleteCondition,
            };
            if (id) {
                Object.assign(conditions, {
                    ...conditions,
                    _id: {
                        $ne: id,
                    },
                });
            }

            return await this.taskModel.findOne(conditions);
        } catch (error) {
            this.logger.error('Error in checkTaskGanttIdExist func', error);
            throw error;
        }
    }

    async bulkWrite(data: AnyBulkWriteOperation<Document>[]) {
        try {
            await this.taskModel.bulkWrite(data);
        } catch (error) {
            this.logger.error('Error in bulkWrite func', error);
            throw error;
        }
    }

    async checkIsTaskLinkValid(
        taskId: ObjectId,
        newStart: Date,
        newFinish: Date,
    ) {
        try {
            const links = await this.planningModel.aggregate([
                {
                    $unwind: '$taskLinks',
                },
                {
                    $match: {
                        $or: [
                            {
                                'taskLinks.target': {
                                    $eq: taskId,
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'taskLinks.target',
                        foreignField: '_id',
                        as: 'targetTask',
                        pipeline: [
                            {
                                $project: {
                                    start: 1,
                                    finish: 1,
                                    name: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: '$targetTask',
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'taskLinks.source',
                        foreignField: '_id',
                        as: 'sourceTask',
                        pipeline: [
                            {
                                $project: {
                                    start: 1,
                                    finish: 1,
                                    name: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: '$sourceTask',
                },
                {
                    $project: {
                        targetTask: 1,
                        sourceTask: 1,
                        'taskLinks.type': 1,
                    },
                },
            ]);

            return links.some((link) => {
                let source;
                let target;

                if (link.sourceTask._id.toString() === taskId.toString()) {
                    source = {
                        ...link.sourceTask,
                        start: newStart,
                        finish: newFinish,
                    };
                    target = link.targetTask;
                } else {
                    target = {
                        ...link.targetTask,
                        start: newStart,
                        finish: newFinish,
                    };
                    source = link.sourceTask;
                }

                if (link.taskLinks.type === LinkType.FINISH_TO_START) {
                    return moment(target.start).isBefore(moment(source.finish));
                }
                if (link.taskLinks.type === LinkType.START_TO_START) {
                    return moment(target.start).isBefore(moment(source.start));
                }
                if (link.taskLinks.type === LinkType.FINISH_TO_FINISH) {
                    return moment(target.finish).isBefore(
                        moment(source.finish),
                    );
                }
                if (link.taskLinks.type === LinkType.START_TO_FINISH) {
                    return moment(target.finish).isBefore(moment(source.start));
                }
                return false;
            });
        } catch (error) {
            this.logger.error('Error in checkIsTaskLinkValid func', error);
            throw error;
        }
    }

    async isParentTask(taskId: ObjectId) {
        try {
            const childTasks = await this.taskModel.find({
                parentId: taskId,
            });

            return childTasks.length > 0;
        } catch (error) {
            this.logger.error('Error in isParentTask service', error);
            throw error;
        }
    }

    async getAllTasksInPlanning(
        planningId: ObjectId,
        attrs = [...taskListAttributes],
    ) {
        try {
            const tasks = await this.taskModel
                .find({
                    ...softDeleteCondition,
                    planningId,
                })
                .select(attrs);
            return tasks;
        } catch (error) {
            this.logger.error('Error in getAllTasksInPlanning service', error);
            throw error;
        }
    }

    async getRootTaskHasPermissionCreateChild(planning: PlanningDocument) {
        try {
            if (planning.isTemplate) {
                return this.taskModel.find({
                    parentGanttId: null,
                    planningId: new ObjectId(planning._id),
                    ...softDeleteCondition,
                });
            } else {
                const delegatedTaskInOriginalPlanning =
                    await this.taskModel.find({
                        planningId: planning.delegatedFromPlanningId,
                        taskType: {
                            $ne: TaskType.WBS_SUMMARY,
                        },
                        delegatedTo: {
                            $ne: null,
                        },
                        ...softDeleteCondition,
                    });
                const taskIdsDelegatedFromOriginalPlanning =
                    delegatedTaskInOriginalPlanning.map((task) => {
                        return new ObjectId(task.delegatedTo);
                    });

                return await this.taskModel
                    .find({
                        _id: {
                            $in: taskIdsDelegatedFromOriginalPlanning,
                        },
                        planningId: new ObjectId(planning._id),
                        ...softDeleteCondition,
                    })
                    .lean();
            }
        } catch (error) {
            this.logger.error(
                'Error in getRootTaskHasPermissionCreateChild service',
                error,
            );
            throw error;
        }
    }

    async getTopdownAndBottomupMilestones(
        planningIds: ObjectId[],
        milestoneType: MilestoneType | false = false,
    ) {
        try {
            const query = {
                ...softDeleteCondition,
                planningId: {
                    $in: planningIds,
                },
                taskType: [TaskType.START_MILESTONE, TaskType.FINISH_MILESTONE],
                linkedLinkId: {
                    $exists: true,
                },
                linkedTaskId: {
                    $exists: true,
                },
            };
            if (milestoneType) {
                Object.assign(query, {
                    ...query,
                    milestoneType,
                });
            }
            const milestones = await this.taskModel
                .find(query, {
                    _id: 1,
                    linkedLinkId: 1,
                    name: 1,
                    planningId: 1,
                })
                .lean();

            return milestones;
        } catch (error) {
            throw error;
        }
    }

    async deleteMilestonesByIds(ids: ObjectId[], deletedBy: ObjectId) {
        try {
            await Promise.all([
                this.taskModel.updateMany(
                    {
                        _id: {
                            $in: ids,
                        },
                    },
                    {
                        deletedBy,
                        deletedAt: new Date(),
                    },
                ),
                this.planningModel.updateOne(
                    {
                        ...softDeleteCondition,
                    },
                    {
                        $pull: {
                            taskLinks: {
                                $or: [
                                    {
                                        source: {
                                            $in: ids,
                                        },
                                    },
                                    {
                                        target: {
                                            $in: ids,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ),
            ]);
        } catch (error) {
            throw error;
        }
    }

    async getMilestoneGanttIdWithCounter(
        milestones: TaskDocument[],
        id: string,
        linkTo: string,
        i18nPath: string,
    ) {
        try {
            let counter = 0;

            let startFloatingMilestoneId = await this.i18n.translate(i18nPath, {
                args: {
                    id,
                    linkTo,
                    counter: '',
                },
            });
            counter = milestones.filter((milestone) =>
                milestone.ganttId.startsWith(startFloatingMilestoneId),
            ).length;
            startFloatingMilestoneId = await this.i18n.translate(i18nPath, {
                args: {
                    id,
                    linkTo,
                    counter: counter + 1,
                },
            });
            return startFloatingMilestoneId;
        } catch (error) {
            throw error;
        }
    }
}
