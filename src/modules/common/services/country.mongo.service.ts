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
    Country,
    CountryDocument,
} from 'src/common/mongo-schemas/country.schema';
import { ObjectId } from 'mongodb';
const countryAttributes = ['name', 'code'];
@Injectable()
export class CountryMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Country.name)
        private readonly countryModel: Model<CountryDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    public async getCountryList(query: IQueryDropdown) {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
            } = query;

            const [items, totalItems] = await Promise.all([
                this.countryModel
                    .find({
                        ...softDeleteCondition,
                    })
                    .select(countryAttributes)
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.countryModel.countDocuments(),
            ]);
            return [items, totalItems];
        } catch (error) {
            this.logger.error('Error in get country list service', error);
            throw error;
        }
    }

    async getCountryById(id: ObjectId) {
        try {
            return this.countryModel
                .findOne({ _id: id, ...softDeleteCondition })
                .select(countryAttributes);
        } catch (error) {
            this.logger.error('Error in check country exist service', error);
            throw error;
        }
    }
}
