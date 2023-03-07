import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ProjectMongoService } from './services/project.mongo.service';
import { ConfigService } from '@nestjs/config';
import { ProjectController } from './controllers/project.controller';
import { Project, ProjectSchema } from './mongo-schemas/project.schema';
import { OpenStreetMapService } from '../common/services/open-street-map.service';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { PlanningController } from './controllers/planning.controller';
import { PlanningMongoService } from './services/planning.mongo.service';
import { ProjectTask, TaskSchema } from './mongo-schemas/task.schema';
import {
    ProjectPlanning,
    PlanningSchema,
} from './mongo-schemas/planning.schema';
import { LinkMongoService } from './services/link.mongo.service';
import { TaskMongoService } from './services/task.mongo.service';
import {
    ProjectLog,
    ProjectLogSchema,
} from '../project-log/mongo-schemas/project-log.schema';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import { GroupMongoService } from '../group/services/group.mongo.service';
import { BaselinePlanningMongoService } from './services/baseline-planning.mongo.service';
import {
    BaselinePlanning,
    BaselinePlanningSchema,
} from './mongo-schemas/baseline-planning.schema';
import { BaselinePlanningController } from './controllers/baseline-planning.controller';
import { TaskController } from './controllers/task.controller';
import {
    ActivityCodeValue,
    ActivityCodeValueSchema,
} from './mongo-schemas/activity-code-value.schema';
import { ActivityCodeMongoService } from './services/activity-code.mongo.service';
import { ActivityCodeController } from './controllers/activity-code.controller';
import { RedisService } from 'src/common/services/redis.service';
import {
    BaselineConfiguration,
    BaselineConfigurationSchema,
} from './mongo-schemas/baseline-configuration.schema';
import { BaselineConfigurationController } from './controllers/baseline-configuration.controller';
import { BaselineConfigurationMongoService } from './services/baseline-configuration.mongo.service';
import {
    ProjectFieldSetting,
    ProjectFieldSettingSchema,
} from './mongo-schemas/project-field-setting.schema';
import { ProjectFieldSettingMongoService } from './services/project-field-setting.mongo.service';
import { Calendar, CalendarSchema } from './mongo-schemas/calendar.schema';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarConfigMongoService } from './services/calendar-config.mongo.service';
import {
    CalendarConfig,
    CalendarConfigSchema,
} from './mongo-schemas/calendar-config.schema';
import { CalendarMongoService } from './services/calendar.mongo.service';
import { DayTypeMongoService } from './services/day-type.mongo.service';
import { DayType, DayTypeSchema } from './mongo-schemas/day-type.schema';
import { DayTypeController } from './controllers/day-type.controller';
import { DownloadCSVGateway } from '../support-request/service/download-csv.socket.gateway';
import { SocketGateway } from 'src/common/services/socket.gateway';
import { ProjectNotificationMongoService } from './services/project-notification.mongo.service';
import {
    ProjectNotification,
    ProjectNotificationSchema,
} from './mongo-schemas/project-notification.schema';
import {
    ActivityCode,
    ActivityCodeSchema,
} from './mongo-schemas/activity-code.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectTask.name, schema: TaskSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectPlanning.name, schema: PlanningSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectLog.name, schema: ProjectLogSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
            { name: Group.name, schema: GroupSchema },
            {
                name: Viewer3dProfile.name,
                schema: Viewer3dProfileSchema,
            },
            {
                name: ProjectProfile.name,
                schema: ProjectProfileSchema,
            },
            {
                name: UserToken.name,
                schema: UserTokenSchema,
            },
            {
                name: ProjectGroup.name,
                schema: ProjectGroupSchema,
            },
            { name: BaselinePlanning.name, schema: BaselinePlanningSchema },
            {
                name: BaselineConfiguration.name,
                schema: BaselineConfigurationSchema,
            },
            { name: ActivityCode.name, schema: ActivityCodeSchema },
            { name: ActivityCodeValue.name, schema: ActivityCodeValueSchema },
            {
                name: ProjectFieldSetting.name,
                schema: ProjectFieldSettingSchema,
            },
            {
                name: Calendar.name,
                schema: CalendarSchema,
            },
            {
                name: CalendarConfig.name,
                schema: CalendarConfigSchema,
            },
            {
                name: DayType.name,
                schema: DayTypeSchema,
            },
            {
                name: ProjectNotification.name,
                schema: ProjectNotificationSchema,
            },
        ]),
    ],
    controllers: [
        ProjectController,
        TaskController,
        PlanningController,
        BaselinePlanningController,
        BaselineConfigurationController,
        ActivityCodeController,
        CalendarController,
        DayTypeController,
    ],
    providers: [
        ProjectMongoService,
        OpenStreetMapService,
        ConfigService,
        JwtService,
        AuditLogMongoService,
        PlanningMongoService,
        ProjectLogMongoService,
        LinkMongoService,
        TaskMongoService,
        UserMongoService,
        GroupMongoService,
        BaselinePlanningMongoService,
        BaselineConfigurationMongoService,
        ActivityCodeMongoService,
        RedisService,
        ProjectFieldSettingMongoService,
        CalendarConfigMongoService,
        CalendarMongoService,
        DayTypeMongoService,
        DownloadCSVGateway,
        SocketGateway,
        ProjectNotificationMongoService,
    ],
    exports: [PlanningMongoService],
})
export class ProjectModule {}
