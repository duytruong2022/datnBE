import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from './mongo-schemas/viewer-3d-profile.schema';
import { Viewer3DProfileController } from './viewer-3d-profile.controller';
import { ProfileService } from './services/viewer-3d-profile.mongo.service';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import { GroupMongoService } from '../group/services/group.mongo.service';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import {
    ProjectProfile,
    ProjectProfileSchema,
} from '../project-profile/mongo-schemas/project-profile.schema';
import { UserMongoService } from '../user/services/user.mongo.service';
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
            { name: Viewer3dProfile.name, schema: Viewer3dProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
        GroupMongoService,
        UserMongoService,
        RedisService,
        BaselineConfigurationMongoService,
    ],
    controllers: [Viewer3DProfileController],
})
export class Viewer3DProfileModule {}
