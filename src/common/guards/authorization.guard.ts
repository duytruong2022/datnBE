import {
    CanActivate,
    ExecutionContext,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import intersection from 'lodash/intersection';
import { AccessModules, UserRoles } from '../constants';
import { getAccessModules } from '../helpers/commonFunctions';

export const Permissions = (permissions: string[]) =>
    SetMetadata('permissions', permissions);

@Injectable()
export class AuthorizationGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const adminAccessModules = getAccessModules(
            request?.loginUser?.accessModules,
            UserRoles.ADMIN,
        );
        if (
            adminAccessModules.includes(AccessModules.SPACIALYTIC_CONSTELLATION)
        ) {
            return true;
        }

        const routeRequiredPermissions = this.reflector.get<string[]>(
            'permissions',
            context.getHandler(),
        );

        if (
            !routeRequiredPermissions ||
            routeRequiredPermissions?.length === 0
        ) {
            return true;
        }
        return (
            intersection(
                request?.loginUser?.permissions || [],
                routeRequiredPermissions,
            ).length > 0
        );
    }
}
