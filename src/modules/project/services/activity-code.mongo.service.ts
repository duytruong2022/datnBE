import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Expression, Model } from 'mongoose';
import { createWinstonLogger } from 'src/common/services/winston.service';

import {
    ActivityCodeValue,
    ActivityCodeValueDocument,
} from '../mongo-schemas/activity-code-value.schema';

import { ObjectId } from 'mongodb';
import { softDeleteCondition } from 'src/common/constants';
import {
    ActivityCode,
    ActivityCodeDocument,
} from '../mongo-schemas/activity-code.schema';
import { ProjectPlanning } from '../mongo-schemas/planning.schema';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import {
    IActivityCodeBody,
    IActivityCodeValueBody,
    IAssignActivityCodeValue,
} from '../project.interface';

const activityCodeAttribute = [
    'name',
    'description',
    'colorCode',
    'parentId',
    'projectId',
    'activityCodeId',
];

@Injectable()
export class ActivityCodeMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ActivityCodeValue.name)
        private readonly activityCodeValueModel: Model<ActivityCodeValueDocument>,
        @InjectModel(ActivityCode.name)
        private readonly activityCodeModel: Model<ActivityCodeDocument>,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<ProjectPlanning>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}
    private readonly logger = createWinstonLogger(
        'activity-code-service',
        this.configService,
    );

    async getActivityCodeList(projectId: ObjectId) {
        try {
            const activityCodeList = await this.activityCodeModel.aggregate([
                {
                    $match: {
                        projectId: {
                            $eq: new mongoose.Types.ObjectId(projectId),
                        },
                        ...softDeleteCondition,
                    } as unknown as Expression,
                },
                {
                    $lookup: {
                        from: 'activity_code_values',
                        localField: '_id',
                        foreignField: 'activityCodeId',
                        pipeline: [
                            {
                                $match: {
                                    ...softDeleteCondition,
                                } as Expression,
                            },
                        ],
                        as: 'activityCodeValues',
                    },
                },
            ]);

            return activityCodeList;
        } catch (error) {
            this.logger.error('Error in getActivityCodeList func', error);
            throw error;
        }
    }

    async getActivityCodeValue(id: ObjectId, projectId: ObjectId) {
        try {
            return await this.activityCodeValueModel
                .findOne({
                    _id: id,
                    projectId: projectId,
                    ...softDeleteCondition,
                })
                .select([...activityCodeAttribute]);
        } catch (error) {
            this.logger.error('Error in getActivityCodeValue func', error);
            throw error;
        }
    }

    async createActivityCodeValue(body: IActivityCodeValueBody) {
        try {
            const newActivityCode = {
                ...body,
                createdBy: body.createdBy,
                createdAt: new Date(),
            };
            return await this.activityCodeValueModel.create(newActivityCode);
        } catch (error) {
            this.logger.error('Error in createActivityCodeValue func', error);
            throw error;
        }
    }

    async updateActivityCodeValue(id: ObjectId, body: IActivityCodeValueBody) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.activityCodeValueModel.updateOne(
                {
                    _id: id,
                    projectId: body.projectId,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        name: body.name,
                        description: body.description,
                        colorCode: body.colorCode,
                        parentId: body.parentId,
                        updatedBy: body.updatedBy,
                        updatedAt: new Date(),
                    },
                },
            );
            await session.commitTransaction();
            return await this.getActivityCodeValue(id, body.projectId);
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in updateActivityCode func', error);
            throw error;
        }
    }

    async deleteActivityCodeValue(id: ObjectId, userId: ObjectId) {
        try {
            await this.activityCodeValueModel.updateOne(
                {
                    _id: id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy: userId,
                    },
                },
            );
        } catch (error) {
            this.logger.error('Error in deleteActivityCodeValue func', error);
            throw error;
        }
    }

    async getActivityCodeById(id: ObjectId) {
        try {
            return await this.activityCodeModel.findOne({
                _id: id,
                ...softDeleteCondition,
            });
        } catch (error) {
            this.logger.error('Error in getActivityCodeById func', error);
            throw error;
        }
    }

    async createActivityCode(body: IActivityCodeBody) {
        try {
            const newActivityCode = {
                ...body,
                createdBy: body.createdBy,
                createdAt: new Date(),
            };
            return await this.activityCodeModel.create(newActivityCode);
        } catch (error) {
            this.logger.error('Error in createActivityCode func', error);
            throw error;
        }
    }

    async updateActivityCode(id: ObjectId, body: IActivityCodeBody) {
        try {
            await this.activityCodeModel.updateOne(
                {
                    _id: id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        name: body.name,
                        maxLength: body.maxLength,
                    },
                },
            );
            return await this.getActivityCodeById(id);
        } catch (error) {
            this.logger.error('Error in renameActivityCode func', error);
            throw error;
        }
    }

    async deleteActivityCode(id: ObjectId, userId: ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const activityCodeValueList =
                await this.activityCodeValueModel.find({
                    activityCodeId: id,
                    ...softDeleteCondition,
                });

            const activityCodeValueIds = activityCodeValueList.map(
                (activityCodeValue) => {
                    return activityCodeValue._id;
                },
            );

            await this.activityCodeModel.updateOne(
                {
                    _id: id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy: userId,
                    },
                },
                {
                    session,
                },
            );

            await this.activityCodeValueModel.updateMany(
                {
                    activityCodeId: id,
                    ...softDeleteCondition,
                },

                {
                    $set: {
                        deletedAt: new Date(),
                        deletedBy: userId,
                    },
                },
                {
                    session,
                },
            );

            await this.taskModel.updateMany(
                {
                    activityCodeValueId: {
                        $in: activityCodeValueIds,
                    },
                    ...softDeleteCondition,
                },

                {
                    $set: {
                        activityCodeValueId: null,
                    },
                },
                {
                    session,
                },
            );

            await session.commitTransaction();
        } catch (error) {
            this.logger.error('Error in deleteActivityCode func', error);
            throw error;
        }
    }

    async checkActivityCodeNameExist(name: string, projectId: ObjectId) {
        try {
            const activityCode = await this.activityCodeModel.findOne({
                name,
                projectId,
                ...softDeleteCondition,
            });
            return activityCode;
        } catch (error) {
            this.logger.error('Error in checkActivityCodeExist func', error);
            throw error;
        }
    }

    async checkActivityCodeValueNameExist(
        name: string,
        activityCodeId: ObjectId,
        projectId: ObjectId,
        id?: ObjectId,
    ) {
        try {
            const conditions = {
                name: name,
                activityCodeId: activityCodeId,
                projectId,
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
            return await this.activityCodeValueModel.findOne(conditions);
        } catch (error) {
            this.logger.error(
                'Error in checkActivityCodeNameValueExist func',
                error,
            );
            throw error;
        }
    }

    async checkMaxLengthActivityCodeValueName(
        name: string,
        activityCodeId: ObjectId,
    ) {
        try {
            const activityCode = await this.activityCodeModel.findOne({
                _id: activityCodeId,
                ...softDeleteCondition,
            });
            if (activityCode) {
                return name.length <= activityCode.maxLength;
            }
            return false;
        } catch (error) {
            this.logger.error(
                'Error in checkMaxLengthActivityCodeValueName func',
                error,
            );
            throw error;
        }
    }

    async checkActivityCodeValueColorExist(
        colorCode: string,
        projectId: ObjectId,
        id?: ObjectId,
    ) {
        try {
            const conditions = {
                colorCode: colorCode,
                projectId,
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
            return await this.activityCodeValueModel.findOne(conditions);
        } catch (error) {
            this.logger.error(
                'Error in checkActivityCodeColorExist func',
                error,
            );
            throw error;
        }
    }

    async checkActivityCodeValueExist(id: ObjectId, projectId: ObjectId) {
        try {
            return await this.activityCodeValueModel.findOne({
                _id: id,
                projectId,
                ...softDeleteCondition,
            });
        } catch (error) {
            this.logger.error('Error in checkTaskIdsExists func', error);
            throw error;
        }
    }

    async assignActivityCodeValue(
        assignActivityCode: IAssignActivityCodeValue,
    ) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            await this.taskModel.updateMany(
                {
                    _id: {
                        $in: assignActivityCode.taskIds,
                    },
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        activityCodeValueId:
                            assignActivityCode.activityCodeValueId,
                        updatedBy: assignActivityCode.updatedBy,
                        updatedAt: new Date(),
                    },
                },
                {
                    multi: true,
                },
            );
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in assignActivityCodeValue func', error);
            throw error;
        }
    }

    async getActivityCodeValueById(id: ObjectId) {
        try {
            return await this.activityCodeValueModel
                .findOne({
                    _id: id,
                    ...softDeleteCondition,
                })
                .select([...activityCodeAttribute]);
        } catch (error) {
            this.logger.error('Error in getActivityCodeValueById func', error);
            throw error;
        }
    }
}
