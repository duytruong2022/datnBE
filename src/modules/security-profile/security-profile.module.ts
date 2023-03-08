import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
    AuditLog,
    AuditLogSchema,
} from '../audit-log/mongo-schemas/audit-log.schema';
import { AuditLogMongoService } from '../audit-log/services/audit-log.service';
import { Group, GroupSchema } from '../group/mongo-schemas/group.schema';
import { User, UserSchema } from '../user/mongo-schemas/user.schema';
import {
    SecurityProfile,
    SecurityProfileSchema,
} from './mongo-schemas/security-profile.schema';
import { SecurityProfileController } from './security-profile.controller';
import { SecurityProfileService } from './services/security-profiles.mongo.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SecurityProfile.name, schema: SecurityProfileSchema },
        ]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    providers: [SecurityProfileService, JwtService, AuditLogMongoService],
    controllers: [SecurityProfileController],
})
export class SecurityProfileModule {}
