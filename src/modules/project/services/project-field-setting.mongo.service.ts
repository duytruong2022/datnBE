import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    ProjectFieldSetting,
    ProjectFieldSettingDocument,
} from '../mongo-schemas/project-field-setting.schema';
import { ObjectId } from 'mongodb';
import { IUpdateOrCreateProjectFieldSetting } from '../project.interface';
export const projectFieldSettingAttributes = ['settings'];
@Injectable()
export class ProjectFieldSettingMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectFieldSetting.name)
        private readonly projectFieldSettingModel: Model<ProjectFieldSettingDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    private readonly logger = createWinstonLogger(
        'project-planning-service',
        this.configService,
    );

    async getUserProjectFieldSetting(userId: ObjectId, projectId: ObjectId) {
        try {
            const setting = await this.projectFieldSettingModel
                .findOne({ userId, projectId })
                .select(projectFieldSettingAttributes)
                .lean();
            return setting;
        } catch (error) {
            this.logger.error(
                'Error in getUserProjectFieldSetting service',
                error,
            );
            throw error;
        }
    }

    async updateOrCreateProjectFieldSetting(
        data: IUpdateOrCreateProjectFieldSetting,
    ) {
        try {
            await this.projectFieldSettingModel.updateOne(
                {
                    userId: data.userId,
                    projectId: data.projectId,
                },
                {
                    ...data,
                },
                {
                    upsert: true,
                },
            );
            return await this.getUserProjectFieldSetting(
                data.userId,
                data.projectId,
            );
        } catch (error) {
            this.logger.error(
                'Error in updateOrCreateProjectFieldSetting service',
                error,
            );
            throw error;
        }
    }
}
