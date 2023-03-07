import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    softDeleteCondition,
} from 'src/common/constants';
import { MODULE_NAME } from '../common.constant';
import {
    ProjectProfile,
    ProjectProfileDocument,
} from 'src/modules/project-profile/mongo-schemas/project-profile.schema';
import { IQueryDropdown } from '../common.interface';
import { ObjectId } from 'mongodb';
const projectProfileAttributes = ['name', '_id', 'isDefaultSelect'];
@Injectable()
export class ProjectProfileMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectProfile.name)
        private readonly projectProfileModel: Model<ProjectProfileDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );
    public async getProjectProfileList(query: IQueryDropdown) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                projectId,
            } = query;

            const [items, totalItems] = await Promise.all([
                this.projectProfileModel
                    .find({
                        ...softDeleteCondition,
                        projectId: new ObjectId(projectId),
                    })
                    .select(projectProfileAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.projectProfileModel.countDocuments({
                    ...softDeleteCondition,
                    projectId: new ObjectId(projectId),
                }),
            ]);
            return [items, totalItems];
        } catch (error) {
            this.logger.error(
                'Error in get getProjectProfileList function',
                error,
            );
            throw error;
        }
    }
}
