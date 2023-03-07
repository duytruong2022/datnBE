import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MODULE_NAME } from '../auth.constant';
import { softDeleteCondition } from 'src/common/constants';
import {
    UserRegisterHistory,
    UserRegisterHistoryDocument,
} from '../mongo-schemas/user-register-history.schema.dto';
import moment from 'moment';
@Injectable()
export class UserRegisterHistoryMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(UserRegisterHistory.name)
        private readonly userRegisterHistoryModel: Model<UserRegisterHistoryDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getUserRegisterHistory(email) {
        try {
            const block = await this.userRegisterHistoryModel.findOne({
                email,
                ...softDeleteCondition,
            });
            return block;
        } catch (error) {}
    }

    async createUserRegisterHistory(email: string) {
        try {
            const registerFailure = new this.userRegisterHistoryModel({
                email,
                lastRegisterAt: moment().toDate(),
            });
            await registerFailure.save();
        } catch (error) {
            throw error;
        }
    }

    async addFailedRegister(email: string) {
        try {
            await this.userRegisterHistoryModel.updateOne(
                { ...softDeleteCondition, email },
                {
                    lastRegisterAt: moment().toDate(),
                    $inc: { registerCount: 1 },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteUserRegisterHistory(email: string) {
        try {
            await this.userRegisterHistoryModel.updateOne(
                {
                    ...softDeleteCondition,
                    email,
                },
                {
                    deletedAt: moment().toDate(),
                },
            );
        } catch (error) {
            throw error;
        }
    }
}
