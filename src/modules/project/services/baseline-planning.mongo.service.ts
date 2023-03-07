import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    BaselinePlanning,
    BaselinePlanningDocument,
} from '../mongo-schemas/baseline-planning.schema';

import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    DEFAULT_LIMIT_FOR_PAGINATION,
    INTEGER_POSITIVE_MIN_VALUE,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { ObjectId } from 'mongodb';
import {
    IBaselinePlanningBody,
    IBaselinePlanningListQuery,
} from '../project.interface';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import { BaselinePlanningOrderBy } from '../project.constant';

const baselinePlanningAttribute = ['name', 'planningId', 'baselineTasks'];

@Injectable()
export class BaselinePlanningMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(BaselinePlanning.name)
        private readonly baselinePlanningModel: Model<BaselinePlanningDocument>,
        private readonly i18n: I18nRequestScopeService,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        'base-planning-service',
        this.configService,
    );

    async getBaselinePlanningList(query: IBaselinePlanningListQuery) {
        try {
            const {
                planningId,
                orderBy = BaselinePlanningOrderBy.CREATED_AT,
                orderDirection = OrderDirection.ASCENDING,
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
            } = query;
            const baselineList = await this.baselinePlanningModel
                .find({
                    planningId: new ObjectId(planningId),
                    ...softDeleteCondition,
                })
                .sort({
                    [orderBy]:
                        orderDirection === OrderDirection.ASCENDING ? 1 : -1,
                })
                .limit(limit)
                .skip(limit * (page - 1))
                .select([...baselinePlanningAttribute]);
            const totalItems = await this.baselinePlanningModel.countDocuments({
                planningId: new ObjectId(planningId),
                ...softDeleteCondition,
            });
            return { items: baselineList, totalItems };
        } catch (error) {
            this.logger.error('Error in getBaselinePlanningList func', error);
            throw error;
        }
    }

    async getBaselinePlanningById(_id: ObjectId) {
        try {
            return await this.baselinePlanningModel
                .findOne({
                    ...softDeleteCondition,
                    _id,
                })
                .select([...baselinePlanningAttribute]);
        } catch (error) {
            this.logger.error('Error in getBaselinePlanningById func', error);
            throw error;
        }
    }

    async deleteBaselinePlanning(_id: ObjectId, userId: ObjectId) {
        try {
            await this.baselinePlanningModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            );
        } catch (error) {
            this.logger.error('Error in getBaselinePlanningById func', error);
            throw error;
        }
    }

    async checkBaselineNameExist(body: IBaselinePlanningBody, _id?: ObjectId) {
        try {
            const condition = {
                ...softDeleteCondition,
                name: {
                    $regex: `^${body.name}$`,
                    $options: 'i',
                },
                planningId: new ObjectId(body.planningId),
            };

            if (_id) {
                Object.assign(condition, {
                    ...condition,
                    _id: {
                        $ne: _id,
                    },
                });
            }
            return await this.baselinePlanningModel.findOne(condition);
        } catch (error) {
            this.logger.error('Error in checkBaselineNameExist func', error);
            throw error;
        }
    }

    async updateBaselinePlanning(_id: ObjectId, body: IBaselinePlanningBody) {
        try {
            await this.baselinePlanningModel.updateOne(
                {
                    _id,
                    ...softDeleteCondition,
                },
                {
                    name: body.name,
                    updatedBy: new ObjectId(body.updatedBy),
                },
            );
            return await this.getBaselinePlanningById(_id);
        } catch (error) {
            this.logger.error('Error in checkBaselineNameExist func', error);
            throw error;
        }
    }

    async createBaselinePlanning(body: IBaselinePlanningBody) {
        try {
            const taskList = await this.taskModel.find({
                ...softDeleteCondition,
                planningId: new ObjectId(body.planningId),
            });
            const newBaselinePlanning = {
                name: body.name,
                planningId: new ObjectId(body.planningId),
                baselineTasks: taskList.map((task) => {
                    return {
                        taskId: task._id,
                        baselineStart: task.start,
                        baselineFinish: task.finish,
                    };
                }),
                createdBy: new ObjectId(body.createdBy),
            };
            return await this.baselinePlanningModel.create(newBaselinePlanning);
        } catch (error) {
            this.logger.error('Error in createBaselinePlanning func', error);
            throw error;
        }
    }
}
