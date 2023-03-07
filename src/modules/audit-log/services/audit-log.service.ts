import {
    AuditLog,
    AuditLogDocument,
} from './../mongo-schemas/audit-log.schema';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { IAuditLogCreateBody } from '../audit-log.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(AuditLog.name)
        private readonly auditLogModel: Model<AuditLogDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}
    private readonly logger = createWinstonLogger(
        'audit-log',
        this.configService,
    );

    async createAuditLog(auditLog: IAuditLogCreateBody) {
        try {
            const record = new this.auditLogModel({
                ...auditLog,
                createdAt: new Date(),
            });
            await record.save();
        } catch (error) {
            this.logger.error('Error in createAuditLog service', error);
            throw error;
        }
    }
}
