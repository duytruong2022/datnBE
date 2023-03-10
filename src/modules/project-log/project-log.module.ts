import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
    ProjectLog,
    ProjectLogSchema,
} from './mongo-schemas/project-log.schema';
import { ProjectLogController } from './project-log.controller';
import { ProjectLogMongoService } from './services/project-log.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProjectLog.name, schema: ProjectLogSchema },
        ]),
    ],
    controllers: [ProjectLogController],
    providers: [ProjectLogMongoService, JwtService],
})
export class ProjectLogModule {
    //
}
