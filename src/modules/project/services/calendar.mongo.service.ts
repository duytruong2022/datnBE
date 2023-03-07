import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import {
    CalendarListQuery,
    ICreateCalendar,
    IUpdateCalendar,
} from '../project.interface';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    softDeleteCondition,
} from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ObjectId } from 'mongodb';
import { Calendar, CalendarDocument } from '../mongo-schemas/calendar.schema';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import { TaskDuration, taskListAttributes } from '../project.constant';
import {
    CalendarConfig,
    CalendarConfigDocument,
} from '../mongo-schemas/calendar-config.schema';
import moment from 'moment';
export const calendarAttributes = ['name', 'isDefaultCalendar', 'projectId'];
import sortedIndex from 'lodash/sortedIndex';
import {
    PlanningDocument,
    ProjectPlanning,
} from '../mongo-schemas/planning.schema';
import { TaskMongoService } from './task.mongo.service';

@Injectable()
export class CalendarMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Calendar.name)
        private readonly calendarModel: Model<CalendarDocument>,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(CalendarConfig.name)
        private readonly calendarConfigModel: Model<CalendarConfigDocument>,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<PlanningDocument>,
        @InjectConnection()
        private readonly connection: Connection,
        private readonly taskService: TaskMongoService,
    ) {}

    private readonly logger = createWinstonLogger(
        'calendar-service',
        this.configService,
    );

    async getCalendarList(query: CalendarListQuery) {
        try {
            const {
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                page = DEFAULT_FIRST_PAGE,
                projectId,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
            } = query;
            const [items, totalItems] = await Promise.all([
                this.calendarModel
                    .find({
                        ...softDeleteCondition,
                        projectId: new ObjectId(projectId),
                    })
                    .select(calendarAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ [orderBy]: orderDirection })
                    .lean(),
                this.calendarModel.countDocuments({
                    ...softDeleteCondition,
                    projectId: new ObjectId(projectId),
                }),
            ]);
            return { items, totalItems };
        } catch (error) {
            throw error;
        }
    }

    async getCalendarById(id: ObjectId, attrs = calendarAttributes) {
        try {
            const calendar = await this.calendarModel
                .findOne({
                    ...softDeleteCondition,
                    _id: id,
                })
                .select(attrs);
            return calendar;
        } catch (error) {
            throw error;
        }
    }

    async getProjectCalendarByName(
        projectId: ObjectId,
        name: string,
        excludedId: ObjectId | null = null,
        attrs = calendarAttributes,
    ) {
        try {
            const mongoQuery = {
                ...softDeleteCondition,
                projectId,
                name,
            };
            if (excludedId) {
                Object.assign(mongoQuery, {
                    ...mongoQuery,
                    _id: {
                        $ne: excludedId,
                    },
                });
            }
            const calendar = await this.calendarModel
                .findOne(mongoQuery)
                .select(attrs);
            return calendar;
        } catch (error) {
            throw error;
        }
    }

    async createCalendar(data: ICreateCalendar) {
        try {
            const calendar = new this.calendarModel(data);
            await calendar.save();
            return await this.getCalendarById(calendar._id);
        } catch (error) {
            throw error;
        }
    }

    async updateCalendar(id: ObjectId, data: IUpdateCalendar) {
        try {
            await this.calendarModel.updateOne({ _id: id }, data);
            return await this.getCalendarById(id);
        } catch (error) {
            throw error;
        }
    }

    async deleteCalendar(id: ObjectId, deletedBy: ObjectId) {
        const session = await this.connection.startSession();
        try {
            await session.startTransaction();
            await this.calendarModel.updateOne(
                { _id: id },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                { session },
            );
            await this.calendarConfigModel.updateMany(
                {
                    calendarId: id,
                },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
                { session },
            );
            await session.commitTransaction();
        } catch (error) {
            session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async calculateNewTaskFinish(
        planningId: ObjectId,
        calendarId: ObjectId,
        session: ClientSession = null,
        taskId: ObjectId | null = null,
    ) {
        try {
            if (!session) {
                session = await this.connection.startSession();
            }
            const query = {
                ...softDeleteCondition,
                planningId,
                durationType: TaskDuration.STANDARD,
            };
            if (taskId) {
                Object.assign(query, {
                    ...query,
                    _id: taskId,
                });
            }
            const tasks = await this.taskModel
                .find(query, {
                    name: 1,
                    start: 1,
                    finish: 1,
                    durationType: 1,
                    originalDuration: 1,
                    calendarId: 1,
                })
                .lean();

            const calendarConfigs = await this.calendarConfigModel
                .find(
                    {
                        ...softDeleteCondition,
                        calendarId,
                    },
                    { date: 1 },
                    {
                        sort: {
                            date: 1,
                        },
                    },
                )
                .lean();
            // for binary search
            const originalDatesArray = calendarConfigs.map(
                (calendarConfig) => ({
                    date: calendarConfig.date,
                    id: +`${moment(calendarConfig.date).year()}${moment(
                        calendarConfig.date,
                    ).dayOfYear()}`,
                }),
            );
            originalDatesArray.sort((a, b) => {
                return a.id - b.id;
            });

            const datesArray = originalDatesArray.map((date) => date.id);
            const mapTaskIdToExtendDay = new Map<string, string>();
            tasks.forEach((task) => {
                const startDate = +`${moment(task.start).year()}${moment(
                    task.start,
                ).dayOfYear()}`;
                const startDateIndex = sortedIndex(datesArray, startDate);

                if (startDateIndex === -1) {
                    return;
                }
                if (startDateIndex >= datesArray.length) {
                    return;
                }
                const endDateIndex = startDateIndex + task.originalDuration - 1;
                if (endDateIndex >= datesArray.length) {
                    return;
                }
                const newFinishDate = moment(
                    originalDatesArray[endDateIndex].date,
                )
                    .add(1, 'day')
                    .fmFullTimeString();
                mapTaskIdToExtendDay.set(task._id.toString(), newFinishDate);
            });

            return mapTaskIdToExtendDay;
        } catch (error) {
            throw error;
        }
    }

    async updateDefaultCalendar(
        calendarId: ObjectId,
        projectId: ObjectId,
        shouldUpdateProjectDefaultCalendar = true,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            if (shouldUpdateProjectDefaultCalendar) {
                await this.calendarModel.bulkWrite(
                    [
                        {
                            updateMany: {
                                filter: {
                                    ...softDeleteCondition,
                                    projectId,
                                },
                                update: {
                                    isDefaultCalendar: false,
                                },
                            },
                        },
                        {
                            updateOne: {
                                filter: {
                                    ...softDeleteCondition,
                                    _id: calendarId,
                                },
                                update: {
                                    isDefaultCalendar: true,
                                },
                            },
                        },
                    ],
                    {
                        session,
                    },
                );
            }
            const plannings = await this.planningModel
                .find(
                    {
                        ...softDeleteCondition,
                        projectId,
                    },
                    {
                        _id: 1,
                    },
                    {
                        session,
                    },
                )
                .lean();
            const allTasks = await this.taskModel.find({
                ...softDeleteCondition,
                planningId: {
                    $in: plannings.map((planning) => planning._id),
                },
                calendarId: {
                    $ne: null,
                },
            });

            const mapTaskIdToTask = new Map<string, TaskDocument>();
            allTasks.forEach((task) =>
                mapTaskIdToTask.set(task._id.toString(), task),
            );
            for (let i = 0; i < plannings.length; ++i) {
                const newTaskFinish = await this.calculateNewTaskFinish(
                    plannings[i]._id,
                    calendarId,
                    session,
                );
                const taskIdsString = newTaskFinish.keys();
                let taskId = taskIdsString.next().value;
                while (taskId) {
                    const task = mapTaskIdToTask.get(taskId);
                    await this.taskService.updateTask(
                        new ObjectId(taskId),
                        {
                            ...task.toObject(),
                            updatedBy: new ObjectId(task.updatedBy.toString()),
                            finish: moment(newTaskFinish.get(taskId)).toDate(),
                        },
                        session,
                    );

                    taskId = taskIdsString.next().value;
                }
            }
            await session.commitTransaction();
        } catch (error) {
            session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updateTaskCalendar(taskId: ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const task = await this.taskModel.findOne(
                {
                    ...softDeleteCondition,
                    _id: taskId,
                },
                {},
                { session },
            );
            let calendarId;
            if (task.calendarId) {
                calendarId = task.calendarId;
            } else {
                const planning = await this.planningModel.findOne({
                    ...softDeleteCondition,
                    _id: task.planningId,
                });
                if (planning) {
                    const defaultCalendar = await this.calendarModel.findOne(
                        {
                            ...softDeleteCondition,
                            projectId: planning.projectId,
                            isDefaultCalendar: true,
                        },
                        {},
                        { session },
                    );
                    if (defaultCalendar) {
                        calendarId = defaultCalendar._id;
                    }
                }
            }
            if (!calendarId) {
                const updatedTask = await this.taskModel
                    .findOne({
                        ...softDeleteCondition,
                        _id: taskId,
                    })
                    .select(taskListAttributes)
                    .lean();
                return updatedTask;
            }

            const newTaskFinish = await this.calculateNewTaskFinish(
                task.planningId,
                calendarId,
                session,
                task._id,
            );

            const taskIdsString = newTaskFinish.keys();
            const taskIdString = taskIdsString.next().value;

            let updatedTasks;
            if (taskIdString === task._id.toString()) {
                updatedTasks = await this.taskService.updateTask(
                    new ObjectId(taskIdString),
                    {
                        ...task.toObject(),
                        updatedBy: new ObjectId(task.updatedBy.toString()),
                        finish: moment(
                            newTaskFinish.get(taskIdString),
                        ).toDate(),
                    },
                    session,
                );
            } else {
                await session.commitTransaction();
                const updatedTask = await this.taskModel
                    .findOne({
                        ...softDeleteCondition,
                        _id: taskId,
                    })
                    .select(taskListAttributes)
                    .lean();
                return updatedTask;
            }
            await session.commitTransaction();
            return updatedTasks;
        } catch (error) {
            session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getCalendarByIds(ids: ObjectId[], attrs = calendarAttributes) {
        try {
            const calendars = await this.calendarModel
                .find({
                    ...softDeleteCondition,
                    _id: {
                        $in: ids,
                    },
                })
                .select(attrs);
            return calendars;
        } catch (error) {
            throw error;
        }
    }

    async getProjectDefaultCalendar(projectId: ObjectId) {
        try {
            const defaultCalendar = await this.calendarModel.findOne({
                ...softDeleteCondition,
                projectId,
                isDefaultCalendar: true,
            });
            return defaultCalendar;
        } catch (error) {
            throw error;
        }
    }

    async getCalendarsInProject(
        projectId: ObjectId,
        attrs = calendarAttributes,
    ) {
        try {
            const calendars = await this.calendarModel
                .find({
                    ...softDeleteCondition,
                    projectId,
                })
                .select(attrs);
            return calendars;
        } catch (error) {
            throw error;
        }
    }

    async unsetDefaultCalendar(projectId: ObjectId) {
        try {
            await this.calendarModel.updateMany(
                {
                    projectId,
                },
                {
                    isDefaultCalendar: false,
                },
            );
        } catch (error) {
            throw error;
        }
    }
}
