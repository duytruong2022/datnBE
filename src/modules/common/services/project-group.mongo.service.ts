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
import { IQueryDropdown } from '../common.interface';
import {
    ProjectGroup,
    ProjectGroupDocument,
} from 'src/modules/project-group/mongo-schemas/project-group.schema';
const projectGroupAttributes = ['name'];
@Injectable()
export class ProjectGroupMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectGroup.name)
        private readonly projectGroupModel: Model<ProjectGroupDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    public async getProjectGroupList(query: IQueryDropdown) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                projectId,
            } = query;

            const [items, totalItems] = await Promise.all([
                this.projectGroupModel
                    .find({ ...softDeleteCondition, projectId })
                    .select(projectGroupAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.projectGroupModel.countDocuments(),
            ]);

            return [items, totalItems];
        } catch (error) {
            this.logger.error('Error in getProjectGroupList service', error);
            throw error;
        }
    }
}
