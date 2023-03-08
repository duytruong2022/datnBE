import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Expression, Model } from 'mongoose';
import {
    ICreateAdditionalTaskFieldBody,
    ICreatePlanningBody,
    IDelegateTaskBody,
    IPlanningByPathNameQuery,
    IPlanningFileLocation,
    IPlanningListQuery,
    ISynthesisPlanningBody,
    IUpdateDelegation,
    IUpdateOriginalPlanning,
    IUpdatePlanning,
    IUpdatePlanningDetail,
} from '../project.interface';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    MongoCollection,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ObjectId } from 'mongodb';
import {
    ProjectPlanning,
    PlanningDocument,
} from '../mongo-schemas/planning.schema';
import {
    planningAttributes,
    taskListAttributes,
    TaskType,
    MilestoneType,
    TopDownFolderName,
    BottomUpFolderName,
    contentFolderName,
    InitTemplateTasks,
    MilestoneLinkToOption,
    MilestoneLinkTo,
    LinkType,
    MilestoneColor,
    TaskConstraint,
} from '../project.constant';
import { parseMongoProjection } from 'src/common/helpers/commonFunctions';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import { Project, ProjectDocument } from '../mongo-schemas/project.schema';
import { cloneDeep } from 'lodash';
import {
    BaselineConfiguration,
    BaselineConfigurationDocument,
} from '../mongo-schemas/baseline-configuration.schema';
import { DownloadCSVGateway } from 'src/modules/support-request/service/download-csv.socket.gateway';
import moment from 'moment';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { TaskMongoService } from './task.mongo.service';
import { Calendar, CalendarDocument } from '../mongo-schemas/calendar.schema';

@Injectable()
export class PlanningMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<PlanningDocument>,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(BaselineConfiguration.name)
        private readonly baselineConfigurationModel: Model<BaselineConfigurationDocument>,
        @InjectModel(Calendar.name)
        private readonly calendarModel: Model<CalendarDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        private readonly taskService: TaskMongoService,
        private readonly downloadCSVGateway: DownloadCSVGateway,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    private readonly logger = createWinstonLogger(
        'project-planning-service',
        this.configService,
    );

    async isNameUniqueInProject(
        projectId: ObjectId,
        planningData: {
            name: string;
            _id?: ObjectId;
        },
    ) {
        // TODO implement check name is also unique in ftp server so that we can prevent file is overriden.
        try {
            const matchCondition = {
                ...softDeleteCondition,
                name: planningData.name,
                projectId,
            };
            if (planningData._id) {
                Object.assign(matchCondition, {
                    ...matchCondition,
                    _id: {
                        $ne: planningData._id,
                    },
                });
            }

            const count = await this.planningModel.countDocuments(
                matchCondition,
            );

            return count === 0;
        } catch (error) {
            this.logger.error('Error in isNameUniqueInProject func', error);
            throw error;
        }
    }

    async createPlanning(
        projectId: ObjectId,
        projectName: string,
        body: ICreatePlanningBody,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const entity = new this.planningModel({
                ...body,
                projectId,
            });
            const savedPlanning = await entity.save({
                session,
            });

            // create a baseline configuration
            const baselineConfiguration = new this.baselineConfigurationModel({
                planningId: savedPlanning._id,
                createdBy: savedPlanning.createdBy,
            });
            await baselineConfiguration.save({ session });

            await session.commitTransaction();
            return savedPlanning;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in createPlanning func', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getPlanningById(_id: ObjectId, attrs = [...planningAttributes]) {
        try {
            return await this.planningModel
                .findOne({
                    _id,
                    ...softDeleteCondition,
                })
                .select(attrs);
        } catch (error) {
            this.logger.error('Error in getPlanningById func', error);
            throw error;
        }
    }

    async getPlanningByNameAndPath(
        id: ObjectId,
        attrs = [...planningAttributes],
    ) {
        try {
            const taskProjectionExpr = parseMongoProjection(
                taskListAttributes.map((attr) => 'tasks.'.concat(attr)),
            );
            const planningProjectionExpr = parseMongoProjection(attrs);

            const [planning] = await this.planningModel.aggregate([
                {
                    $match: {
                        _id: id as unknown as Expression,
                        ...(softDeleteCondition as unknown as Record<
                            string,
                            Expression
                        >),
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: '_id',
                        foreignField: 'planningId',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'tasks',
                    },
                },
                // we should sort the tasks array because the $lookup operator cannot guarantee the order of result for each query
                // decontructs "tasks" array field to output a document for each element
                {
                    $unwind: {
                        path: '$task',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // sort nested tasks by startDate ascending
                {
                    $sort: {
                        'tasks.startDate': 1,
                    },
                },
                // group all record that have same _id we have created from previous stage, push each "tasks" value in "tasks" field
                // "first" field is the current document
                {
                    $group: {
                        _id: '$_id',
                        tasks: {
                            $push: '$tasks',
                        },
                        first: {
                            $first: '$$ROOT',
                        },
                    },
                },
                // replace the document with the document which is combined from "first" field and "tasks" field
                // the "first" field have all the property include the "tasks" array
                // the "tasks" field have sorted task and will be overrided
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                '$first',
                                {
                                    tasks: '$tasks',
                                },
                            ],
                        },
                    },
                },
                // get fields that we need
                {
                    $project: {
                        ...planningProjectionExpr,
                        ...taskProjectionExpr,
                    },
                },
            ]);

            if (!planning) {
                return null;
            }
            planning.tasks = planning.tasks[0];
            const calendars = await this.calendarModel.aggregate([
                {
                    $match: {
                        ...softDeleteCondition,
                        projectId: planning.projectId,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_CALENDAR_CONFIGS,
                        localField: '_id',
                        foreignField: 'calendarId',
                        as: 'configs',
                        pipeline: [
                            {
                                $sort: {
                                    date: 1,
                                },
                            },
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as unknown as Expression,
                            },
                            {
                                $project: {
                                    workingDayTypeId: 1,
                                    date: 1,
                                },
                            },
                            {
                                $lookup: {
                                    from: MongoCollection.PROJECT_CALENDAR_DAY_TYPES,
                                    localField: 'workingDayTypeId',
                                    foreignField: '_id',
                                    as: 'dayType',
                                    pipeline: [
                                        {
                                            $project: {
                                                timeBlocks: 1,
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                $unwind: '$dayType',
                            },
                        ],
                    },
                },
                {
                    $project: {
                        configs: 1,
                        name: 1,
                        isDefaultCalendar: 1,
                    },
                },
            ]);
            planning.calendars = calendars;
            return planning;
        } catch (error) {
            this.logger.error('Error in getPlanningByNameAndPath func', error);
            throw error;
        }
    }

    async validatePlanningIds(ids: ObjectId[]): Promise<boolean> {
        try {
            const count = await this.planningModel.countDocuments({
                _id: { $in: ids },
                isSynthesized: false,
                ...softDeleteCondition,
            });
            return count === ids.length;
        } catch (error) {
            this.logger.error('Error in validatePlanningIds func', error);
            throw error;
        }
    }

    async getPlanningList(projectId: ObjectId, query: IPlanningListQuery) {
        try {
            const {
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                page = DEFAULT_FIRST_PAGE,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                keyword = '',
            } = query;
            const mongoQuery = {
                ...softDeleteCondition,
                projectId,
            };

            if (keyword.length) {
                Object.assign(mongoQuery, {
                    ...mongoQuery,
                    name: {
                        $regex: `.*${keyword}.*`,
                        $options: 'i',
                    },
                });
            }

            const [items, totalItems] = await Promise.all([
                this.planningModel
                    .find(
                        mongoQuery,
                        {},
                        {
                            skip: (page - 1) * limit,
                            limit: limit,
                            sort: {
                                [orderBy]:
                                    orderDirection === OrderDirection.ASCENDING
                                        ? 1
                                        : -1,
                            },
                        },
                    )
                    .lean(),
                this.planningModel.countDocuments(mongoQuery),
            ]);

            return {
                items,
                totalItems,
            };
        } catch (error) {
            this.logger.error('Error in getPlanningList func', error);
            throw error;
        }
    }

    async getPlanningByFilePaths(paths: string[]) {
        try {
            return await this.planningModel
                .find({
                    planningFilePath: {
                        $in: paths,
                    },
                    ...softDeleteCondition,
                })
                .lean();
        } catch (error) {
            this.logger.error('Error in getPlanningByFilePaths func', error);
        }
    }

    async updatePlanning(_id: ObjectId, body: IUpdatePlanning) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.planningModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        ...body,
                    },
                },
                {
                    session,
                },
            );

            await session.commitTransaction();
            return await this.getPlanningById(_id);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in updatePlanning func', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getPlanningByProjectIdAndPath(
        projectId: ObjectId,
        name: string,
        planningFilePath: string,
    ) {
        return await this.planningModel
            .findOne({
                projectId,
                name,
                planningFilePath,
                ...softDeleteCondition,
            })
            .lean();
    }

    async updatePlanningDetail(_id: ObjectId, data: IUpdatePlanningDetail) {
        try {
            await this.planningModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        ...data,
                    },
                },
            );
            return await this.getPlanningById(_id);
        } catch (error) {
            this.logger.error('Error in updatePlanningDetail func', error);
        }
    }

    async getPlanningsByNamesAndPaths(paths: IPlanningFileLocation[]) {
        try {
            const query = paths.map((path) => ({
                name: path.name,
                planningFilePath: path.path,
            }));
            return await this.planningModel
                .find({
                    $or: query,
                    ...softDeleteCondition,
                })
                .lean();
        } catch (error) {
            this.logger.error('Error in getPlanningByFilePaths func', error);
        }
    }

    async deletePlanning(
        _id: ObjectId,
        data: {
            planningName: string;
            deletedBy: ObjectId;
            projectId: ObjectId;
        },
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.planningModel.updateMany(
                {
                    _id,
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy: data.deletedBy,
                    },
                },
                {
                    session,
                },
            );

            const taskIdsWillDelete = (
                await this.taskModel.find(
                    {
                        planningId: _id,
                        ...softDeleteCondition,
                    },
                    {},
                )
            ).map((item) => item._id);

            await this.taskModel.updateMany(
                {
                    _id: { $in: taskIdsWillDelete },
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy: data.deletedBy,
                    },
                },
                {
                    session,
                },
            );

            await this.taskModel.updateMany(
                {
                    delegatedTo: {
                        $in: taskIdsWillDelete,
                    },
                    ...softDeleteCondition,
                },
                { $set: { delegatedTo: null } },
                { session },
            );

            // get all taskId in this planning
            const tasks = await this.taskModel.find(
                {
                    planningId: _id,
                    ...softDeleteCondition,
                },
                {
                    _id: 1,
                },
            );

            const taskIds = tasks.map((task) => task._id);

            // set 'delegatedTo' field of task which is created by deleted tasks above to null
            await this.taskModel.updateMany(
                {
                    _id: {
                        $in: taskIds,
                    },
                    ...softDeleteCondition,
                },
                {
                    $set: { delegatedTo: null },
                },
                { session },
            );

            await this.baselineConfigurationModel.updateOne(
                {
                    planningId: _id,
                },
                {
                    deletedAt: new Date(),
                    deletedBy: data.deletedBy,
                },
                {
                    session,
                },
            );

            await session.commitTransaction();

            return _id;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in deletePlanning func', error);
        } finally {
            await session.endSession();
        }
    }

    async getTaskFieldById(planningId: ObjectId, fieldId: ObjectId) {
        try {
            const planning = await this.planningModel
                .findOne(
                    {
                        _id: planningId,
                        ...softDeleteCondition,
                        'additionalTaskFields._id': fieldId,
                    },
                    {
                        'additionalTaskFields.$': 1,
                    },
                )
                .lean();

            return planning.additionalTaskFields?.[0];
        } catch (error) {
            this.logger.error('Error in getTaskFieldById func', error);
        }
    }

    async checkTaskFieldNameExists(
        planningId: ObjectId,
        fieldName: string,
        _id?: ObjectId,
    ) {
        try {
            const condition = {};
            if (_id) {
                Object.assign(condition, {
                    'additionalTaskFields._id': {
                        $ne: _id,
                    },
                });
            }
            const count = await this.planningModel.countDocuments({
                _id: planningId,
                ...softDeleteCondition,
                ...condition,
                'additionalTaskFields.name': fieldName,
            });

            return count > 0;
        } catch (error) {
            this.logger.error('Error in checkTaskFieldNameExists func', error);
        }
    }

    async addCustomTaskField(
        planningId: ObjectId,
        body: ICreateAdditionalTaskFieldBody,
    ) {
        try {
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                },
                {
                    $push: {
                        additionalTaskFields: {
                            $each: [
                                {
                                    ...body,
                                },
                            ],
                            $position: 0,
                        },
                    },
                },
            );

            const planning = await this.planningModel
                .findOne(
                    {
                        _id: planningId,
                        ...softDeleteCondition,
                    },
                    {
                        additionalTaskFields: {
                            $elemMatch: {
                                name: body.name,
                                dataType: body.dataType,
                            },
                        },
                    },
                )
                .lean();

            return planning.additionalTaskFields?.[0];
        } catch (error) {
            this.logger.error('Error in addCustomTaskField func', error);
        }
    }

    async updateCustomTaskField(
        planningId: ObjectId,
        fieldId: ObjectId,
        body: {
            oldName: string;
            newName: string;
        },
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                    'additionalTaskFields._id': fieldId,
                },
                {
                    $set: {
                        'additionalTaskFields.$.name': body.newName,
                    },
                },
                { session },
            );
            await this.taskModel.updateMany(
                {
                    planningId,
                    ...softDeleteCondition,
                },
                {
                    $rename: {
                        [`additionalFields.${body.oldName}`]: `additionalFields.${body.newName}`,
                    },
                },
                {
                    session,
                    upsert: false,
                    multi: true,
                },
            );
            await session.commitTransaction();
            return await this.getTaskFieldById(planningId, fieldId);
        } catch (error) {
            this.logger.error('Error in updateCustomTaskField func', error);
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    }

    async deleteCustomTaskFieldName(
        planningId: ObjectId,
        fieldId: ObjectId,
        fieldName: string,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.planningModel.updateOne(
                {
                    _id: planningId,
                    ...softDeleteCondition,
                },
                {
                    $pull: {
                        additionalTaskFields: {
                            _id: fieldId,
                        },
                    },
                },
                {
                    session,
                },
            );
            await this.taskModel.updateMany(
                {
                    ...softDeleteCondition,
                    planningId,
                },
                {
                    $unset: {
                        [`additionalFields.${fieldName}`]: '',
                    },
                },
                { session },
            );
            await session.commitTransaction();
        } catch (error) {
            session.abortTransaction();
            this.logger.error('Error in deleteCustomTaskFieldName func', error);
        } finally {
            session.endSession();
        }
    }

    async getSynthesizedFromPlanning(planningId: ObjectId) {
        try {
            const plannings = await this.planningModel.aggregate([
                {
                    $match: {
                        _id: {
                            $eq: planningId,
                        },
                    } as unknown as Expression,
                },
                {
                    $unwind: '$clonedFromPlanningIds',
                },
                {
                    $group: {
                        _id: '$clonedFromPlanningIds',
                    },
                },
            ]);
            return plannings.map((planning) => planning._id);
        } catch (error) {
            throw error;
        }
    }

    async getClonedLevel2FromPlanning(planningId: ObjectId) {
        try {
            const plannings = await this.planningModel.aggregate([
                {
                    $match: {
                        _id: {
                            $eq: planningId,
                        },
                    } as unknown as Expression,
                },
                {
                    $unwind: '$clonedFromPlanningIds',
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_PLANNINGS,
                        localField: 'clonedFromPlanningIds',
                        foreignField: '_id',
                        as: 'clonedFromPlanningLevel1',
                    },
                },
                {
                    $unwind: {
                        path: '$clonedFromPlanningLevel1',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $unwind: {
                        path: '$clonedFromPlanningLevel1.clonedFromPlanningIds',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_PLANNINGS,
                        localField:
                            'clonedFromPlanningLevel1.clonedFromPlanningIds',
                        foreignField: '_id',
                        as: 'clonedFromPlanningLevel2',
                    },
                },
                {
                    $unwind: {
                        path: '$clonedFromPlanningLevel2',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        _id: '$clonedFromPlanningLevel2._id',
                    },
                },
            ]);

            return plannings.map((planning) => planning._id);
        } catch (error) {
            throw error;
        }
    }

    async countAllLinksInProject(projectId: ObjectId) {
        try {
            const count = await this.planningModel.aggregate([
                {
                    $match: {
                        ...softDeleteCondition,
                        projectId,
                    } as unknown as Expression,
                },
                {
                    $project: {
                        linkCount: {
                            $size: '$taskLinks',
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalLink: {
                            $sum: '$linkCount',
                        },
                    },
                },
            ]);
            return count?.[0]?.totalLink;
        } catch (error) {
            this.logger.error('Error in countAllLinksInProject func', error);
            throw error;
        }
    }

    async getPlanningByPathAndName(query: IPlanningByPathNameQuery) {
        try {
            const planning = await this.planningModel.findOne({
                projectId: new ObjectId(query.projectId),
                name: query.name,
                planningFilePath: query.planningFilePath,
            });

            if (planning?.originalPlanningId) {
                return this.getPlanningById(planning?.originalPlanningId, [
                    'name',
                    'planningFilePath',
                ]);
            }
            return planning;
        } catch (error) {
            throw error;
        }
    }

    async getDelegatePlanningListHasModifyFromOriginal(planningId: ObjectId) {
        try {
            const delegatedTasks = await this.taskModel.find({
                planningId: planningId,
                taskType: {
                    $ne: TaskType.WBS_SUMMARY,
                },
                delegatedTo: {
                    $ne: null,
                },
                ...softDeleteCondition,
            });

            if (!delegatedTasks) {
                return [];
            }

            const delegateTaskIds = delegatedTasks.map((task) => {
                return task.delegatedTo;
            });
            const milestonesDelegateInDelegation = await this.taskModel.find({
                inheritedFromTaskId: {
                    $in: delegateTaskIds,
                },
                milestoneType: {
                    $in: [
                        MilestoneType.TOP_DOWN_DELEGATE_IM,
                        MilestoneType.TOP_DOWN_DELEGATE_FL,
                        MilestoneType.TOP_DOWN_DELEGATE_CF,
                    ],
                },
                ...softDeleteCondition,
            });

            const delegationHasModifyIds: ObjectId[] = [];
            const taskHasModifyIds: ObjectId[] = [];

            delegatedTasks.forEach((task) => {
                const imageMilestoneStart = milestonesDelegateInDelegation.find(
                    (milestone) => {
                        return (
                            milestone.inheritedFromTaskId.toString() ===
                                task.delegatedTo.toString() &&
                            milestone.milestoneType ===
                                MilestoneType.TOP_DOWN_DELEGATE_IM &&
                            milestone.milestoneLinkTo === MilestoneLinkTo.START
                        );
                    },
                );
                const imageMilestoneFinish =
                    milestonesDelegateInDelegation.find((milestone) => {
                        return (
                            milestone.inheritedFromTaskId.toString() ===
                                task.delegatedTo.toString() &&
                            milestone.milestoneType ===
                                MilestoneType.TOP_DOWN_DELEGATE_IM &&
                            milestone.milestoneLinkTo === MilestoneLinkTo.FINISH
                        );
                    });
                const initialMilestoneStart =
                    milestonesDelegateInDelegation.find((milestone) => {
                        return (
                            milestone.inheritedFromTaskId.toString() ===
                                task.delegatedTo.toString() &&
                            milestone.milestoneType ===
                                MilestoneType.TOP_DOWN_DELEGATE_CF &&
                            milestone.milestoneLinkTo === MilestoneLinkTo.START
                        );
                    });
                const initialMilestoneFinish =
                    milestonesDelegateInDelegation.find((milestone) => {
                        return (
                            milestone.inheritedFromTaskId.toString() ===
                                task.delegatedTo.toString() &&
                            milestone.milestoneType ===
                                MilestoneType.TOP_DOWN_DELEGATE_CF &&
                            milestone.milestoneLinkTo === MilestoneLinkTo.FINISH
                        );
                    });

                if (!initialMilestoneStart || !initialMilestoneFinish) {
                    return [];
                }

                const startDate = imageMilestoneStart
                    ? imageMilestoneStart.start
                    : initialMilestoneStart.start;
                const finishDate = imageMilestoneFinish
                    ? imageMilestoneFinish.finish
                    : initialMilestoneFinish.finish;
                if (
                    moment(task.start).diff(startDate) !== 0 ||
                    moment(task.finish).diff(finishDate) !== 0
                ) {
                    delegationHasModifyIds.push(
                        initialMilestoneStart.planningId,
                    );
                    taskHasModifyIds.push(task.delegatedTo);
                }
            });

            const planningsHasModify = await this.planningModel.aggregate([
                {
                    $match: {
                        _id: {
                            $in: delegationHasModifyIds,
                        },
                        ...softDeleteCondition,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: MongoCollection.PROJECT_TASKS,
                        localField: '_id',
                        foreignField: 'planningId',
                        pipeline: [
                            {
                                $match: {
                                    _id: {
                                        $in: taskHasModifyIds,
                                    },
                                    ...softDeleteCondition,
                                } as unknown as Expression,
                            },
                        ],
                        as: 'tasksHasModify',
                    },
                },
            ]);

            return planningsHasModify;
        } catch (error) {
            this.logger.error(
                'Error in getDelegatePlanningHasModifyList func',
                error,
            );
            throw error;
        }
    }

    async checkOriginalPlanning(
        originalPlanningId: ObjectId,
        delegationIds: ObjectId[],
    ) {
        const delegations = await this.planningModel.find({
            _id: {
                $in: delegationIds,
            },
            ...softDeleteCondition,
        });

        if (!delegations) {
            return false;
        }

        return delegations.every((delegation) => {
            if (!delegation.delegatedFromPlanningId) {
                return false;
            } else {
                return (
                    delegation.delegatedFromPlanningId.toString() ===
                    originalPlanningId.toString()
                );
            }
        });
    }

    async addDeletedLinkIdsTopdownAndBottomup(
        planningId: ObjectId,
        linkId: ObjectId,
    ) {
        try {
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                {
                    $push: {
                        deletedLinkIdsBottomup: linkId,
                        deletedLinkIdsTopdown: linkId,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteDeletedLinkTopdown(planningId: ObjectId, linkIds: ObjectId[]) {
        try {
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                {
                    $pullAll: {
                        deletedLinkIdsTopdown: linkIds,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteDeletedLinkBottomup(planningId: ObjectId, linkIds: ObjectId[]) {
        try {
            await this.planningModel.updateOne(
                { _id: planningId, ...softDeleteCondition },
                {
                    $pullAll: {
                        deletedLinkIdsBottomup: linkIds,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }
}
