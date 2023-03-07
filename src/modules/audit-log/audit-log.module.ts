import { AuditLog, AuditLogSchema } from './mongo-schemas/audit-log.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditLogMongoService } from './services/audit-log.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
    ],
    controllers: [],
    providers: [AuditLogMongoService],
})
export class AuditLogModule {
    //
}
