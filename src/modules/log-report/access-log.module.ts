import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    AccessLog,
    AccessLogSchema,
} from '../access-log/mongo-schemas/access-log.schema';
import { LogReportController } from './log-report.controller';
import { LogReportMongoService } from './service/log-report.service';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import {
    SupportRequest,
    SupportRequestSchema,
} from '../support-request/mongo-schemas/support-request.schema';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: SupportRequest.name, schema: SupportRequestSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [LogReportController],
    providers: [LogReportMongoService, JwtService],
})
export class LogReportModule {
    //
}
