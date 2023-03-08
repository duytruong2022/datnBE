import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import ConfigKey from '../config/config-key';
import { JwtService } from '@nestjs/jwt';
import { extractToken } from '../helpers/commonFunctions';
import { IUserToken } from '../interfaces';
import { ConfigService } from '@nestjs/config';
import { UserTokenTypes } from '../constants';

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = extractToken(request.headers.authorization || '');
        if (!token) {
            throw new UnauthorizedException();
        }
        request.loginUser = (await this.validateToken(
            token,
            request.authorizationType === UserTokenTypes.REFRESH_TOKEN,
        )) as IUserToken;
        request.accessToken = token;
        return true;
    }

    async validateToken(token: string, isRefreshToken = false) {
        try {
            if (isRefreshToken) {
                return await this.jwtService.verify(token, {
                    secret: this.configService.get(
                        ConfigKey.JWT_REFRESH_TOKEN_SECRET_KEY,
                    ),
                    ignoreExpiration: false,
                });
            } else {
                return await this.jwtService.verify(token, {
                    secret: this.configService.get(
                        ConfigKey.JWT_ACCESS_TOKEN_SECRET_KEY,
                    ),
                    ignoreExpiration: false,
                });
            }
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}
