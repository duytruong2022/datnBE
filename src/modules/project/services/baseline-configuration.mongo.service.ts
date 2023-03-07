import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { softDeleteCondition } from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    BaselineConfiguration,
    BaselineConfigurationDocument,
} from '../mongo-schemas/baseline-configuration.schema';
import {
    IBaselineConfigurationBody,
    IBaselineConfigurationQuery,
} from '../project.interface';

const baselineConfigurationAttribute = [
    '_id',
    'planningId',
    'display',
    'color',
    'position',
];

@Injectable()
export class BaselineConfigurationMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(BaselineConfiguration.name)
        private readonly baselineConfigurationModel: Model<BaselineConfigurationDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        'base-configuration-service',
        this.configService,
    );

    async getBaselineConfiguration(query: IBaselineConfigurationQuery) {
        try {
            const { planningId } = query;
            return await this.baselineConfigurationModel
                .findOne({
                    planningId: new ObjectId(planningId),
                    ...softDeleteCondition,
                })
                .select([...baselineConfigurationAttribute]);
        } catch (error) {
            this.logger.error('Error in getBaselineConfiguration func', error);
            throw error;
        }
    }

    async getBaselineConfigurationById(_id: ObjectId) {
        try {
            return await this.baselineConfigurationModel
                .findOne({
                    _id,
                    ...softDeleteCondition,
                })
                .select([...baselineConfigurationAttribute]);
        } catch (error) {
            this.logger.error(
                'Error in getBaselineConfigurationById func',
                error,
            );
            throw error;
        }
    }

    async updateBaselineConfiguration(
        _id: ObjectId,
        body: IBaselineConfigurationBody,
    ) {
        try {
            await this.baselineConfigurationModel.updateOne(
                { _id, ...softDeleteCondition },
                {
                    display: body.display,
                    color: body.color,
                    position: body.position,
                    updatedBy: new ObjectId(body.updatedBy),
                },
            );

            return await this.getBaselineConfigurationById(_id);
        } catch (error) {
            this.logger.error(
                'Error in updateBaselineConfiguration func',
                error,
            );
            throw error;
        }
    }

    async deleteBaselineConfiguration(_id: ObjectId, userId: ObjectId) {
        try {
            await this.baselineConfigurationModel.updateOne(
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
            this.logger.error(
                'Error in deleteBaselineConfiguration func',
                error,
            );
            throw error;
        }
    }
}
