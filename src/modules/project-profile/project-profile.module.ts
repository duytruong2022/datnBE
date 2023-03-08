import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
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
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import { ProjectGroupMongoService } from '../project-group/services/project-group.mongo.service';
import {
    ProjectLog,
    ProjectLogSchema,
} from '../project-log/mongo-schemas/project-log.schema';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import {
    PlanningSchema,
    ProjectPlanning,
} from '../project/mongo-schemas/planning.schema';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from './mongo-schemas/project-profile.schema';
import { ProfileController } from './project-profile.controller';
import { ProfileService } from './services/project-profile.mongo.service';
import { ProjectTask, TaskSchema } from '../project/mongo-schemas/task.schema';
import { BaselineConfigurationMongoService } from '../project/services/baseline-configuration.mongo.service';
import {
    BaselineConfiguration,
    BaselineConfigurationSchema,
} from '../project/mongo-schemas/baseline-configuration.schema';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProjectProfile.name, schema: ProjectProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: ProjectLog.name, schema: ProjectLogSchema },
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
            {
                name: SecurityProfile.name,
                schema: SecurityProfileSchema,
            },
        ]),
        MongooseModule.forFeature([
            {
                name: BaselineConfiguration.name,
                schema: BaselineConfigurationSchema,
            },
        ]),
    ],
    providers: [
        ProfileService,
        JwtService,
        ProjectMongoService,
        ProjectGroupMongoService,
        ProjectLogMongoService,
        UserMongoService,
        BaselineConfigurationMongoService,
    ],
    controllers: [ProfileController],
})
export class ProjectProfileModule {}
