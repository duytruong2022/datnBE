import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessLogController } from './access-log.controller';
import { AccessLog, AccessLogSchema } from './mongo-schemas/access-log.schema';
import { AccessLogMongoService } from './services/access-log.mongo.service';
import { RedisService } from 'src/common/services/redis.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
        ]),
    ],
    controllers: [AccessLogController],
    providers: [AccessLogMongoService, JwtService, RedisService],
})
export class AccessLogModule {
    //
}
