import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from './common/services/i18n.service';
import { WinstonModule } from './common/services/winston.service';
import envSchema from './common/config/validation-schema';
import { AppController } from './app.controller';
import { HeaderMiddleware } from './common/middleware/header.middleware';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/transform.interceptor';
import { HttpExceptionFilter } from './common/exceptions.filter';
import { MongoModule } from './common/services/mongo.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { GroupModule } from './modules/group/group.module';
import mongoose from 'mongoose';
import ConfigKey from './common/config/config-key';
import { ProjectModule } from './modules/project/project.module';
import { SecurityProfileModule } from './modules/security-profile/security-profile.module';
import { CommonModule } from './modules/common/common.module';
import { NotificationModule } from './modules/notification/notification.module';
import { Viewer3DProfileModule } from './modules/3D-viewer-profile/viewer-3d-profile.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AccessLogModule } from './modules/access-log/access-log.module';
import { ProjectGroupModule } from './modules/project-group/project-group.module';
import { ProjectProfileModule } from './modules/project-profile/project-profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SupportRequestModule } from './modules/support-request/support-request.module';
import { ProjectLogModule } from './modules/project-log/project-log.module';
import { LogReportModule } from './modules/log-report/access-log.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: process.env.THUMBNAIL_FOLDER,
            serveRoot: '/thumbnail/',
        }),
        ServeStaticModule.forRoot({
            rootPath: process.env.FILE_STORAGE_SUPPORT_REQUEST_FOLDER,
            serveRoot: '/upload-support-request/',
        }),
        ServeStaticModule.forRoot({
            rootPath: process.env.FILE_STORAGE_SUPPORT_REQUEST_CSV_FOLDER,
            serveRoot: '/export-support-request/',
        }),
        ServeStaticModule.forRoot({
            rootPath: process.env.FILE_STORAGE_PLANNING_FOLDER,
            serveRoot: '/export-planning/',
        }),
        ServeStaticModule.forRoot({
            rootPath: process.env.SFTP_TEMP_DOWNLOAD_FOLDER,
            serveRoot: '/download/',
        }),
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
            validationSchema: envSchema,
        }),
        WinstonModule,
        I18nModule,
        MongoModule,
        AuthModule,
        UserModule,
        ProjectModule,
        GroupModule,
        SecurityProfileModule,
        CommonModule,
        NotificationModule,
        Viewer3DProfileModule,
        AuditLogModule,
        AccessLogModule,
        ProjectGroupModule,
        ProjectProfileModule,
        SupportRequestModule,
        ProjectLogModule,
        LogReportModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            scope: Scope.REQUEST,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
    exports: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(HeaderMiddleware).forRoutes('*');
        mongoose.set('debug', process.env[ConfigKey.MONGO_DEBUG] === 'enable');
    }
}
