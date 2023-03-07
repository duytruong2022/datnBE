import {
    Viewer3dProfile,
    Viewer3dProfileDocument,
} from 'src/modules/3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
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
const viewer3dProfileAttributes = ['name', '_id', 'isDefaultSelect'];
@Injectable()
export class Viewer3DProfileMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Viewer3dProfile.name)
        private readonly viewer3dProfileModel: Model<Viewer3dProfileDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );
    public async get3DViewerProfileList(query: IQueryDropdown) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
            } = query;

            const [items, totalItems] = await Promise.all([
                this.viewer3dProfileModel
                    .find({
                        ...softDeleteCondition,
                    })
                    .select(viewer3dProfileAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.viewer3dProfileModel.countDocuments(),
            ]);
            return [items, totalItems];
        } catch (error) {
            this.logger.error(
                'Error in get get3DViewerProfileList function',
                error,
            );
            throw error;
        }
    }
}
