import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { WebAppGateway } from '../../common/services/webapp.socket.gateway';
import { SocketGateway } from '../../common/services/socket.gateway';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    SupportRequest,
    SupportRequestSchema,
} from './mongo-schemas/support-request.schema';
import { SupportRequestService } from './service/support-request.mongo.service';
import { SupportRequestController } from './support-request.controller';
import { DownloadCSVGateway } from './service/download-csv.socket.gateway';
import { SendGridService } from 'src/common/services/sendgrid.service';
import { UserMongoService } from '../user/services/user.mongo.service';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    Notification,
    NotificationSchema,
} from '../notification/mongo-schemas/notification.schema';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { RedisService } from 'src/common/services/redis.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SupportRequest.name, schema: SupportRequestSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: User.name, schema: UserSchema },
            { name: UserToken.name, schema: UserTokenSchema },
            { name: User.name, schema: UserSchema },
            { name: Group.name, schema: GroupSchema },
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
            { name: ProjectProfile.name, schema: ProjectProfileSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: Project.name, schema: ProjectSchema },
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
            { name: Country.name, schema: CountrySchema },
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
    ],
    controllers: [SupportRequestController],
    providers: [
        JwtService,
        AuditLogMongoService,
        SupportRequestService,
        SocketGateway,
        WebAppGateway,
        DownloadCSVGateway,
        SendGridService,
        UserMongoService,
        RedisService,
    ],
})
export class SupportRequestModule {}
