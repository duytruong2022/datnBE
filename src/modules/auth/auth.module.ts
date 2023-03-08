import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { AuthMongoService } from './services/auth.mongo.service';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import {
    UserToken,
    UserTokenSchema,
} from './mongo-schemas/user-token.schema.dto';
import { CountryMongoService } from '../common/services/country.mongo.service';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import { NotificationMongoService } from '../notification/services/notification.mongo.service';
import {
    Notification,
    NotificationSchema,
} from '../notification/mongo-schemas/notification.schema';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { LdapService } from '../../common/services/ldap-client.service';
import { AccessLogMongoService } from '../access-log/services/access-log.mongo.service';
import {
    AccessLog,
    AccessLogSchema,
} from '../access-log/mongo-schemas/access-log.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { UserRegisterHistoryMongoService } from './services/user-register-history.service';
import {
    UserRegisterHistory,
    UserRegisterHistorySchema,
} from './mongo-schemas/user-register-history.schema.dto';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import {
    PlanningSchema,
    ProjectPlanning,
} from '../project/mongo-schemas/planning.schema';
import { ProjectTask, TaskSchema } from '../project/mongo-schemas/task.schema';
import { BaselineConfigurationMongoService } from '../project/services/baseline-configuration.mongo.service';
import {
    BaselineConfiguration,
    BaselineConfigurationSchema,
} from '../project/mongo-schemas/baseline-configuration.schema';
@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
        ]),
        MongooseModule.forFeature([
            { name: UserToken.name, schema: UserTokenSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectPlanning.name, schema: PlanningSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectTask.name, schema: TaskSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectProfile.name, schema: ProjectProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: UserRegisterHistory.name,
                schema: UserRegisterHistorySchema,
            },
        ]),
        MongooseModule.forFeature([
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
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
    controllers: [AuthController],
    providers: [
        AuthMongoService,
        JwtService,
        CountryMongoService,
        NotificationMongoService,
        ProjectMongoService,
        UserMongoService,
        AuditLogMongoService,
        LdapService,
        UserRegisterHistoryMongoService,
        AccessLogMongoService,
        BaselineConfigurationMongoService,
    ],
})
export class AuthModule {}
