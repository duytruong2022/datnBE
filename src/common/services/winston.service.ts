import { WinstonModule as NestWinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import winston from 'winston';
import 'winston-daily-rotate-file';
import ConfigKey from '../config/config-key';
import { Module } from '@nestjs/common';

export function createWinstonLogger(
    filename: string,
    configService: ConfigService,
) {
    return winston.createLogger({
        level: configService.get(ConfigKey.LOG_LEVEL),
        format: winston.format.json(),
        defaultMeta: { service: 'pmf-3dwebviewer' },
        transports: [
            new winston.transports.Console({
                level: configService.get(ConfigKey.LOG_LEVEL),
            }),
            new winston.transports.DailyRotateFile({
                filename: `${configService.get(
                    ConfigKey.LOG_ROOT_FOLDER,
                )}/${filename}-%DATE%.log`,
                datePattern: 'YYYY-MM-DD-HH',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
            }),
        ],
    });
}

@Module({
    imports: [
        NestWinstonModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return winston.createLogger({
                    level: configService.get(ConfigKey.LOG_LEVEL),
                    format: winston.format.json(),
                    defaultMeta: { service: 'pmf-3dwebviewer' },
                    transports: [
                        new winston.transports.Console({
                            level: configService.get(ConfigKey.LOG_LEVEL),
                        }),
                        new winston.transports.DailyRotateFile({
                            filename: `${configService.get(
                                ConfigKey.LOG_ROOT_FOLDER,
                            )}/pmf-3dwebviewer-%DATE%.log`,
                            datePattern: 'YYYY-MM-DD-HH',
                            zippedArchive: true,
                            maxSize: '20m',
                            maxFiles: '14d',
                        }),
                    ],
                });
            },
        }),
    ],
    providers: [],
})
export class WinstonModule {}
