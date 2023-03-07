import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { Injectable } from '@nestjs/common';
import ConfigKey from 'src/common/config/config-key';
import Redis from 'ioredis';
import { ObjectId } from 'mongodb';
import { RedisPrefixKey } from '../constants';
let redisClient: Redis;
let isRedisConnected = false;
@Injectable()
export class RedisService {
    constructor(private readonly configService: ConfigService) {
        try {
            if (!isRedisConnected) {
                redisClient = new Redis({
                    host: this.configService.get(ConfigKey.REDIS_HOST),
                    port: this.configService.get(ConfigKey.REDIS_PORT),
                    password: this.configService.get(ConfigKey.REDIS_PASSWORD),
                });
                this.logger.info('Connected to Redis');
                isRedisConnected = true;
            }
        } catch (error) {
            this.logger.error('Error in Redis createConnection', error);
        }
    }
    private readonly logger = createWinstonLogger('redis', this.configService);

    async setUserAccessToken(userId: ObjectId, token: string) {
        try {
            const userIdString = userId.toString();
            redisClient.set(
                `${RedisPrefixKey.ACCESS_TOKEN}_${userIdString}`,
                token,
            );
            redisClient.expire(
                `${RedisPrefixKey.ACCESS_TOKEN}_${userIdString}`,
                this.configService.get(ConfigKey.JWT_ACCESS_TOKEN_EXPIRED_IN),
            );
        } catch (error) {
            this.logger.error('error in setUserAccessToken func');
            throw error;
        }
    }

    async deleteAccessToken(userId) {
        try {
            redisClient.expire(
                `${RedisPrefixKey.ACCESS_TOKEN}_${userId.toString()}`,
                0,
            );
        } catch (error) {
            this.logger.error('error in deleteAccessToken func');
            throw error;
        }
    }

    async getUserAccessToken(userId: ObjectId) {
        try {
            const userIdString = userId.toString();
            const userAccessToken = await redisClient.get(
                `${RedisPrefixKey.ACCESS_TOKEN}_${userIdString}`,
            );
            return userAccessToken;
        } catch (error) {
            this.logger.error('error in getUserAccessToken func');
            throw error;
        }
    }
}
