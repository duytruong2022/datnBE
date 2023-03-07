import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Expression, Model } from 'mongoose';
import { LinkDependency, LinkType, TaskType } from '../project.constant';
import {
    IBulkCreateLinksForMultiplePlanning,
    ICreateLinkBody,
    ILinkDetail,
    IUpdateLinkBody,
} from '../project.interface';
import { MongoCollection, softDeleteCondition } from 'src/common/constants';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ObjectId } from 'bson';
import {
    ProjectPlanning,
    PlanningDocument,
} from '../mongo-schemas/planning.schema';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';

@Injectable()
export class LinkMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<PlanningDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    private readonly logger = createWinstonLogger(
        'task-link-service',
        this.configService,
    );

    async checkSourceTargetValid(source: ObjectId, target: ObjectId) {
        try {
            const count = await this.taskModel.countDocuments({
                _id: { $in: [source, target] },
                ...softDeleteCondition,
            });
            return count === 2;
        } catch (error) {
            this.logger.error('Error in checkSourceTargetValid func', error);
            throw error;
        }
    }

    async checkLinkExists(
        planningId: ObjectId,
        source: ObjectId,
        target: ObjectId,
        type: LinkType,
        _id: ObjectId | null = null,
    ) {
        try {
            const matchCondition = {
                _id: planningId,
                taskLinks: {
                    $elemMatch: {
                        source,
                        target,
                        type,
                    },
                },
            };
            if (_id) {
                Object.assign(matchCondition, {
                    ...matchCondition,
                    _id: {
                        $ne: _id,
                    },
                });
            }

            const count = await this.planningModel.countDocuments(
                matchCondition,
            );

            return count >= 1;
        } catch (error) {
            this.logger.error('Error in checkLinkExists func', error);
            throw error;
        }
    }

    async createLink(planningId: ObjectId, body: ICreateLinkBody) {
        try {
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                },
                {
                    $push: {
                        taskLinks: {
                            ...body,
                            source: new ObjectId(body.source),
                            target: new ObjectId(body.target),
                        },
                    },
                },
            );
            const planning = await this.planningModel
                .findOne({
                    _id: planningId,
                    ...softDeleteCondition,
                    'taskLinks.type': body.type,
                    'taskLinks.source': new ObjectId(body.source),
                    'taskLinks.target': new ObjectId(body.target),
                })
                .lean();

            return planning.taskLinks?.find(
                (link) =>
                    link.type === body.type &&
                    link.source.toString() === body.source.toString() &&
                    link.target.toString() === body.target.toString(),
            );
        } catch (error) {
            this.logger.error('Error in createLink func', error);
            throw error;
        }
    }

    async getLinkListByTaskId(planningId: ObjectId, taskId: ObjectId) {
        try {
            const predecessors: ILinkDetail[] = (
                await this.planningModel.aggregate([
                    {
                        $unwind: '$taskLinks',
                    },
                    {
                        $match: {
                            _id: planningId,
                            'taskLinks.target': taskId,
                            ...softDeleteCondition,
                        } as unknown as Expression,
                    },
                    {
                        $lookup: {
                            from: MongoCollection.PROJECT_TASKS,
                            localField: 'taskLinks.source',
                            foreignField: '_id',
                            as: 'targetTask',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as unknown as Expression,
                                },
                            ],
                        },
                    },
                    {
                        $unwind: '$targetTask',
                    },
                ])
            ).map((link) => {
                return {
                    dependency: LinkDependency.PREDECESSOR,
                    taskLinkToId: link.targetTask?._id,
                    taskLinkToGanttId: link.targetTask?.ganttId,
                    taskLinkToName: link.targetTask?.name,
                    taskLinkToStart: link.targetTask?.start,
                    taskLinkToFinish: link.targetTask?.finish,
                    type: link.taskLinks?.type,
                    taskLag: link.taskLink?.lag || 0,
                };
            });

            const successors: ILinkDetail[] = (
                await this.planningModel.aggregate([
                    {
                        $unwind: '$taskLinks',
                    },
                    {
                        $match: {
                            _id: planningId,
                            'taskLinks.source': taskId,
                            ...softDeleteCondition,
                        } as unknown as Expression,
                    },
                    {
                        $lookup: {
                            from: MongoCollection.PROJECT_TASKS,
                            localField: 'taskLinks.target',
                            foreignField: '_id',
                            as: 'targetTask',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as unknown as Expression,
                                },
                            ],
                        },
                    },
                    {
                        $unwind: '$targetTask',
                    },
                ])
            ).map((link) => {
                return {
                    dependency: LinkDependency.SUCCESSOR,
                    taskLinkToId: link.targetTask?._id,
                    taskLinkToGanttId: link.targetTask?.ganttId,
                    taskLinkToName: link.targetTask?.name,
                    taskLinkToStart: link.targetTask?.start,
                    taskLinkToFinish: link.targetTask?.finish,
                    type: link.taskLinks?.type,
                    taskLag: link.taskLink?.lag || 0,
                };
            });

            return {
                predecessors,
                successors,
            };
        } catch (error) {
            this.logger.error('Error in getLinkListByTaskId func', error);
            throw error;
        }
    }

    async bulkCreateLink(planningId: ObjectId, links: ICreateLinkBody[]) {
        try {
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                },
                {
                    $push: {
                        taskLinks: {
                            $each: links.map((link) => ({
                                ...link,
                                source: new ObjectId(link.source),
                                target: new ObjectId(link.target),
                            })),
                        },
                    },
                },
            );

            const planning = await this.planningModel
                .findOne({
                    _id: planningId,
                    ...softDeleteCondition,
                })
                .select(['taskLinks']);

            return planning?.taskLinks?.filter((taskLink) => {
                return (
                    links.find((link) => {
                        return (
                            link.source === taskLink.source.toString() &&
                            link.target === taskLink.target.toString() &&
                            link.type === taskLink.type
                        );
                    }) !== undefined
                );
            });
        } catch (error) {
            this.logger.error('Error in bulkCreateLink func', error);
            throw error;
        }
    }

    async bulkCreateLinksForMultiplePlanning(
        data: IBulkCreateLinksForMultiplePlanning[],
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const dataGroupedByPlanningId = groupBy(data, (createTask: any) =>
                createTask?.planningId?.toString(),
            );
            const insertLinkQueries = [];

            Object.keys(dataGroupedByPlanningId).forEach((planningIdString) => {
                insertLinkQueries.push({
                    updateOne: {
                        filter: {
                            _id: new ObjectId(planningIdString),
                            ...softDeleteCondition,
                        },
                        update: {
                            $push: {
                                taskLinks: {
                                    $each: dataGroupedByPlanningId[
                                        planningIdString
                                    ].map((link) => ({
                                        type: link.linkData.type,
                                        source: new ObjectId(
                                            link.linkData.source,
                                        ),
                                        target: new ObjectId(
                                            link.linkData.target,
                                        ),
                                    })),
                                },
                            },
                        },
                    },
                });
            });

            await this.planningModel.bulkWrite(insertLinkQueries, {
                session,
            });

            await session.commitTransaction();
        } catch (error) {
            this.logger.error(
                'Error in bulkCreateLinksForMultiplePlanning func',
                error,
            );
            throw error;
        }
    }

    async updateLink(
        planningId: ObjectId,
        _id: ObjectId,
        body: IUpdateLinkBody,
    ) {
        try {
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    'taskLinks._id': _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        'taskLinks.$.type': body.type,
                        'taskLinks.$.source': new ObjectId(body.source),
                        'taskLinks.$.target': new ObjectId(body.target),
                        'taskLinks.$.lag': body.lag,
                    },
                },
            );

            return await this.getLinkById(_id);
        } catch (error) {
            this.logger.error('Error in updateLink func', error);
            throw error;
        }
    }

    async getLinkById(_id: ObjectId) {
        try {
            return await this.planningModel
                .findOne(
                    { 'taskLinks._id': _id },
                    {
                        'taskLinks.$': 1,
                    },
                )
                .lean();
        } catch (error) {
            this.logger.error('Error in getLinkById func', error);
            throw error;
        }
    }

    async deleteLinkById(planningId: ObjectId, _id: ObjectId) {
        try {
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                { $pull: { taskLinks: { _id } } },
            );
            return _id;
        } catch (error) {
            this.logger.error('Error in deleteLinkById func', error);
            throw error;
        }
    }

    async getLinksByTaskSource(taskId: ObjectId) {
        try {
            return await this.planningModel.aggregate([
                {
                    $unwind: '$taskLinks',
                },
                {
                    $match: {
                        $and: [
                            {
                                'taskLinks.target': {
                                    $eq: taskId,
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getLinkByTaskSource func', error);
            throw error;
        }
    }

    async getLinksByTaskTarget(taskId: ObjectId) {
        try {
            return await this.planningModel.aggregate([
                {
                    $unwind: '$taskLinks',
                },
                {
                    $match: {
                        $and: [
                            {
                                'taskLinks.target': {
                                    $eq: taskId,
                                },
                            },
                            {
                                'taskLinks.type': {
                                    $in: [
                                        LinkType.FINISH_TO_START,
                                        LinkType.START_TO_START,
                                    ],
                                },
                            },
                        ] as unknown as Expression[],
                    },
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getLinkByTaskTarget func', error);
            throw error;
        }
    }

    async getLinksByTaskTargetsAndSources(taskIds: ObjectId[]) {
        try {
            return await this.planningModel.aggregate([
                {
                    $unwind: '$taskLinks',
                },
                {
                    $match: {
                        'taskLinks.clonedFromLinkId': { $exists: false },
                        $or: [
                            {
                                'taskLinks.source': {
                                    $in: taskIds,
                                },
                            },
                            {
                                'taskLinks.target': {
                                    $in: taskIds,
                                },
                            },
                        ],
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'taskLinks.target',
                        foreignField: '_id',
                        as: 'targetTask',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                    taskType: {
                                        $nin: [
                                            TaskType.START_MILESTONE,
                                            TaskType.FINISH_MILESTONE,
                                        ],
                                    },
                                } as unknown as Expression,
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
                                $match: {
                                    ...softDeleteCondition,
                                    taskType: {
                                        $nin: [
                                            TaskType.START_MILESTONE,
                                            TaskType.FINISH_MILESTONE,
                                        ],
                                    },
                                } as unknown as Expression,
                            },
                        ],
                    },
                },
                {
                    $unwind: '$sourceTask',
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getLinkByTaskTargets func', error);
            throw error;
        }
    }

    async getLinksByIds(linkIds: ObjectId[]) {
        try {
            return await this.planningModel.aggregate([
                {
                    $unwind: '$taskLinks',
                },
                {
                    $match: {
                        'taskLinks.clonedFromLinkId': { $exists: false },
                        'taskLinks._id': {
                            $in: linkIds,
                        },
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: 'taskLinks.target',
                        foreignField: '_id',
                        as: 'targetTask',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                    taskType: {
                                        $nin: [
                                            TaskType.START_MILESTONE,
                                            TaskType.FINISH_MILESTONE,
                                        ],
                                    },
                                } as unknown as Expression,
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
                                $match: {
                                    ...softDeleteCondition,
                                    taskType: {
                                        $nin: [
                                            TaskType.START_MILESTONE,
                                            TaskType.FINISH_MILESTONE,
                                        ],
                                    },
                                } as unknown as Expression,
                            },
                        ],
                    },
                },
                {
                    $unwind: '$sourceTask',
                },
            ]);
        } catch (error) {
            this.logger.error('Error in getLinkByTaskTargets func', error);
            throw error;
        }
    }

    async deleteLinkAndRelatedMilestonesById(
        planningId: ObjectId,
        linkId: ObjectId,
        deletedBy: ObjectId,
    ) {
        const session = await this.connection.startSession();
        try {
            await session.startTransaction();
            const planning = await this.planningModel
                .findOne(
                    { _id: planningId },
                    {
                        taskLinks: 1,
                    },
                    { session },
                )
                .lean();
            const allLinks = planning.taskLinks;
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                {
                    $pull: { taskLinks: { _id: linkId } },
                },
                {
                    session,
                },
            );

            const mapSourceToTargets = new Map<string, string[]>();
            const mapTargetToSources = new Map<string, string[]>();
            allLinks.forEach((link) => {
                const currentTargets =
                    mapSourceToTargets.get(link.source.toString()) || [];
                mapSourceToTargets.set(link.source.toString(), [
                    ...currentTargets,
                    link.target.toString(),
                ]);

                const currentSources =
                    mapTargetToSources.get(link.target.toString()) || [];
                mapTargetToSources.set(link.target.toString(), [
                    ...currentSources,
                    link.source.toString(),
                ]);
            });

            let taskIdsNeedToBeUpdated = [];

            const startLink = allLinks.find(
                (link) => link._id.toString() === linkId.toString(),
            );
            let taskIdQueue = [
                startLink.source.toString(),
                startLink.target.toString(),
            ];
            const visitedTasks = new Map<string, boolean>();
            // graph traversal
            while (taskIdQueue.length) {
                const taskId = taskIdQueue.pop();
                if (visitedTasks.has(taskId)) {
                    continue;
                }
                visitedTasks.set(taskId, true);
                taskIdsNeedToBeUpdated.push(taskId);
                const linkedToTasks = mapSourceToTargets.get(taskId) || [];
                const tasksLinkedTo = mapTargetToSources.get(taskId) || [];
                taskIdsNeedToBeUpdated = [...taskIdsNeedToBeUpdated].concat(
                    linkedToTasks,
                    tasksLinkedTo,
                );
                taskIdQueue = [...taskIdQueue].concat(linkedToTasks);
            }
            const uniqTaskIdsString = uniq(taskIdsNeedToBeUpdated);
            const uniqTaskIds = uniqTaskIdsString.map((id) => new ObjectId(id));
            await this.taskModel.updateMany(
                {
                    _id: {
                        $in: uniqTaskIds,
                    },
                    taskType: [
                        TaskType.START_MILESTONE,
                        TaskType.FINISH_MILESTONE,
                    ],
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                {
                    session,
                },
            );
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
                                        $in: uniqTaskIds,
                                    },
                                },
                                {
                                    target: {
                                        $in: uniqTaskIds,
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

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(
                'Error in deleteLinkAndRelatedMilestonesById func',
                error,
            );
            throw error;
        } finally {
            await session.endSession();
        }
    }
    async bulkDeleteLinkAndRelatedMilestonesByIds(
        planningId: ObjectId,
        linkIds: ObjectId[],
        deletedBy: ObjectId,
    ) {
        const session = await this.connection.startSession();
        try {
            await session.startTransaction();
            const planning = await this.planningModel
                .findOne(
                    { _id: planningId },
                    {
                        taskLinks: 1,
                    },
                    { session },
                )
                .lean();
            const allLinks = planning.taskLinks;
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                {
                    $pull: {
                        taskLinks: {
                            _id: {
                                $in: linkIds,
                            },
                        },
                    },
                },
                {
                    session,
                },
            );

            const mapSourceToTargets = new Map<string, string[]>();
            allLinks.forEach((link) => {
                const currentTargets =
                    mapSourceToTargets.get(link.source.toString()) || [];
                mapSourceToTargets.set(link.source.toString(), [
                    ...currentTargets,
                    link.target.toString(),
                ]);
            });

            let taskIdsNeedToBeUpdated = [];
            const linkIdsString = linkIds.map((id) => id.toString());
            let taskIdQueue = allLinks
                .filter((link) => linkIdsString.includes(link._id.toString()))
                .flatMap((link) => [
                    link.source.toString(),
                    link.target.toString(),
                ]);
            const visitedTasks = new Map<string, boolean>();
            // graph traversal
            while (taskIdQueue.length) {
                const taskId = taskIdQueue.pop();
                if (visitedTasks.has(taskId)) {
                    continue;
                }
                visitedTasks.set(taskId, true);
                taskIdsNeedToBeUpdated.push(taskId);
                const linkedToTasks = mapSourceToTargets.get(taskId) || [];
                taskIdsNeedToBeUpdated = [...taskIdsNeedToBeUpdated].concat(
                    linkedToTasks,
                );
                taskIdQueue = [...taskIdQueue].concat(linkedToTasks);
            }
            const uniqTaskIdsString = uniq(taskIdsNeedToBeUpdated);
            await this.taskModel.updateMany(
                {
                    _id: {
                        $in: uniqTaskIdsString.map((id) => new ObjectId(id)),
                    },
                    taskType: [
                        TaskType.START_MILESTONE,
                        TaskType.FINISH_MILESTONE,
                    ],
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                {
                    session,
                },
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(
                'Error in bulkDeleteLinkAndRelatedMilestonesByIds func',
                error,
            );
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
