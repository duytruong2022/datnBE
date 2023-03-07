import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { ProjectGroupController } from './project-group.controller';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from './mongo-schemas/project-group.schema';
import { ProjectGroupMongoService } from './services/project-group.mongo.service';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    ProjectLog,
    ProjectLogSchema,
} from '../project-log/mongo-schemas/project-log.schema';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import {
    PlanningSchema,
    ProjectPlanning,
} from '../project/mongo-schemas/planning.schema';
import { ProjectTask, TaskSchema } from '../project/mongo-schemas/task.schema';

import { RedisService } from 'src/common/services/redis.service';
import { BaselineConfigurationMongoService } from '../project/services/baseline-configuration.mongo.service';
import {
    BaselineConfiguration,
    BaselineConfigurationSchema,
} from '../project/mongo-schemas/baseline-configuration.schema';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectProfile.name, schema: ProjectProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectLog.name, schema: ProjectLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectPlanning.name, schema: PlanningSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectTask.name, schema: TaskSchema },
        ]),
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
            { name: Group.name, schema: GroupSchema },
            {
                name: Viewer3dProfile.name,
                schema: Viewer3dProfileSchema,
            },
            {
                name: UserToken.name,
                schema: UserTokenSchema,
            },
            {
                name: ProjectGroup.name,
                schema: ProjectGroupSchema,
            },
        ]),
        MongooseModule.forFeature([
            {
                name: BaselineConfiguration.name,
                schema: BaselineConfigurationSchema,
            },
        ]),
    ],
    controllers: [ProjectGroupController],
    providers: [
        BaselineConfigurationMongoService,
        ProjectGroupMongoService,
        JwtService,
        AuditLogMongoService,
        ProjectLogMongoService,
        UserMongoService,
        ProjectMongoService,
        RedisService,
    ],
})
export class ProjectGroupModule {
    //
}
