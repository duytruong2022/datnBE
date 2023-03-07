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
import { IQueryDropdownByModules } from '../common.interface';
import {
    Group,
    GroupDocument,
} from 'src/modules/group/mongo-schemas/group.schema';
const groupAttributes = ['name', 'securityProfileId', 'description'];
@Injectable()
export class GroupMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    public async getGroupList(query: IQueryDropdownByModules) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                accessModules = [],
            } = query;

            const mongooseQuery = {
                ...softDeleteCondition,
            };
            if (accessModules?.length) {
                Object.assign(mongooseQuery, {
                    ...mongooseQuery,
                    accessModule: {
                        $in: accessModules,
                    },
                });
            }
            const [items, totalItems] = await Promise.all([
                this.groupModel
                    .find({ ...mongooseQuery })
                    .select(groupAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.groupModel.countDocuments(),
            ]);

            return [items, totalItems];
        } catch (error) {
            this.logger.error('Error in getGroupList service', error);
            throw error;
        }
    }
}
