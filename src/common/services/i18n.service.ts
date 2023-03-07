import { Global, Module } from '@nestjs/common';
import {
    I18nModule as NestI18nModule,
    AcceptLanguageResolver,
} from 'nestjs-i18n';
import path from 'path';
import { Languages } from '../constants';

@Global()
@Module({
    imports: [
        NestI18nModule.forRoot({
            fallbackLanguage: Languages.EN,
            loaderOptions: {
                path: path.join('dist/i18n'),
                watch: true,
            },
            resolvers: [AcceptLanguageResolver],
        }),
    ],
    controllers: [],
    providers: [],
})
export class I18nModule {}
