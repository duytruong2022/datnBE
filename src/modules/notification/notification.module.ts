import { Viewer3dProfile } from 'src/modules/3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import { Viewer3dProfileSchema } from './../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    Notification,
    NotificationSchema,
} from './mongo-schemas/notification.schema';
import { NotificationController } from './notification.controller';
import { NotificationMongoService } from './services/notification.mongo.service';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
        ]),
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
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
            { name: UserToken.name, schema: UserTokenSchema },
        ]),
        MongooseModule.forFeature([
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
        ]),
    ],
    controllers: [NotificationController],
    providers: [
        NotificationMongoService,
        JwtService,
        AuditLogMongoService,
        UserMongoService,
    ],
})
export class NotificationModule {
    //
}
