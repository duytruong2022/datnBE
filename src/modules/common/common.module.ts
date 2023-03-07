import {
    ProjectProfile,
    ProjectProfileSchema,
} from './../project-profile/mongo-schemas/project-profile.schema';
import { Group, GroupSchema } from './../group/mongo-schemas/group.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Country,
    CountrySchema,
} from 'src/common/mongo-schemas/country.schema';
import { CommonController } from './common.controller';
import { CountryMongoService } from './services/country.mongo.service';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import { GroupMongoService } from './services/group.mongo.service';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from '../security-profile/mongo-schemas/security-profile.schema';
import { SercurityProfileMongoService } from './services/security-profile.mongo.service';
import { OpenStreetMapService } from './services/open-street-map.service';
import { JwtService } from '@nestjs/jwt';
import {
    UserToken,
    UserTokenSchema,
} from '../auth/mongo-schemas/user-token.schema.dto';
import { ProjectMongoService } from './services/project.mongo.service';
import {
    Project,
    ProjectSchema,
} from '../project/mongo-schemas/project.schema';
import { UserMongoService } from './services/user.mongo.service';
import { Viewer3DProfileMongoService } from './services/viewer-3d-profile.mongo.service';
import {
    Viewer3dProfile,
    Viewer3dProfileSchema,
} from '../3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import { ProjectProfileMongoService } from './services/project-profile.mongo.servicets';
import {
    ProjectGroup,
    ProjectGroupSchema,
} from '../project-group/mongo-schemas/project-group.schema';
import { ProjectGroupMongoService } from './services/project-group.mongo.service';
import { RedisService } from 'src/common/services/redis.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Country.name, schema: CountrySchema },
        ]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([
            { name: UserToken.name, schema: UserTokenSchema },
        ]),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: ProjectProfile.name, schema: ProjectProfileSchema },
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
            { name: ProjectGroup.name, schema: ProjectGroupSchema },
        ]),
    ],
    controllers: [CommonController],
    providers: [
        CountryMongoService,
        GroupMongoService,
        ProjectGroupMongoService,
        SercurityProfileMongoService,
        Viewer3DProfileMongoService,
        OpenStreetMapService,
        UserMongoService,
        JwtService,
        ProjectMongoService,
        ProjectProfileMongoService,
        RedisService,
    ],
})
export class CommonModule {}
