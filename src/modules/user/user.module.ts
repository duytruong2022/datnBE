import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import { SendGridService } from 'src/common/services/sendgrid.service';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import { AuthMongoService } from '../auth/services/auth.mongo.service';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import {
    Notification,
    NotificationSchema,
} from '../notification/mongo-schemas/notification.schema';
import { NotificationMongoService } from '../notification/services/notification.mongo.service';
import { User, UserSchema } from './mongo-schemas/user.schema';
import { UserMongoService } from './services/user.mongo.service';
import { UserController } from './user.controller';
import { ImportUserService } from './services/user.import.service';
import { GroupMongoService } from '../group/services/group.mongo.service';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import { ProjectGroupMongoService } from '../project-group/services/project-group.mongo.service';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import {
    ProjectLog,
    ProjectLogSchema,
} from '../project-log/mongo-schemas/project-log.schema';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
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
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: UserToken.name, schema: UserTokenSchema },
        ]),
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
        ]),
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectPlanning.name, schema: PlanningSchema },
        ]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectTask.name, schema: TaskSchema },
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
            { name: Notification.name, schema: NotificationSchema },
        ]),
        MongooseModule.forFeature([
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: BaselineConfiguration.name,
                schema: BaselineConfigurationSchema,
            },
        ]),
    ],
    controllers: [UserController],
    providers: [
        UserMongoService,
        JwtService,
        AuditLogMongoService,
        NotificationMongoService,
        AuthMongoService,
        SendGridService,
        NotificationMongoService,
        ImportUserService,
        GroupMongoService,
        ProjectGroupMongoService,
        ProjectMongoService,
        ProjectLogMongoService,
        RedisService,
        BaselineConfigurationMongoService,
    ],
})
export class UserModule {
    //
}
