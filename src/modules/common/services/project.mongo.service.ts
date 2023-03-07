import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { MODULE_NAME } from '../common.constant';
import {
    Project,
    ProjectDocument,
} from 'src/modules/project/mongo-schemas/project.schema';
import {
    ProjectProfile,
    ProjectProfileDocument,
} from 'src/modules/project-profile/mongo-schemas/project-profile.schema';
import { softDeleteCondition } from 'src/common/constants';
@Injectable()
export class ProjectMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(ProjectProfile.name)
        private readonly projectProfileModel: Model<ProjectProfileDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    public async getAllProjects() {
        try {
            const [items, totalItems] = await Promise.all([
                this.projectModel.aggregate([
                    {
                        $match: {
                            $and: this.generateUserListQueryBuilder(),
                        },
                    },
                    {
                        $lookup: {
                            from: 'project_profiles',
                            localField: '_id',
                            foreignField: 'projectId',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as Expression,
                                },
                            ],
                            as: 'projectProfiles',
                        },
                    },
                ]),
                this.projectModel.countDocuments({
                    ...softDeleteCondition,
                }),
            ]);

            return [items, totalItems];
        } catch (error) {
            this.logger.error('Error in getProjectList service', error);
            throw error;
        }
    }

    generateUserListQueryBuilder() {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        return conditions;
    }
}
