import { ProjectProfileMongoService } from './services/project-profile.mongo.servicets';
import {
    Controller,
    Get,
    InternalServerErrorException,
    Query,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import { IGetPostalCode, IGetCoordinates } from '../project/project.interface';
import {
    getPostalCodeSchema,
    getCoordinatesSchema,
} from '../project/project.validator';
import { IQueryDropdown, IQueryDropdownByModules } from './common.interface';
import {
    queryDropdownByModuleSchema,
    queryDropdownSchema,
    queryProjectDropdownSchema,
} from './common.validator';
import { CountryMongoService } from './services/country.mongo.service';
import { GroupMongoService } from './services/group.mongo.service';
import { OpenStreetMapService } from './services/open-street-map.service';
import { ProjectMongoService } from './services/project.mongo.service';
import { Viewer3DProfileMongoService } from './services/viewer-3d-profile.mongo.service';
import { SercurityProfileMongoService } from './services/security-profile.mongo.service';
import { UserMongoService } from './services/user.mongo.service';
import { ProjectGroupMongoService } from './services/project-group.mongo.service';

@Controller('/common')
export class CommonController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly countryService: CountryMongoService,
        private readonly groupService: GroupMongoService,
        private readonly projectGroupService: ProjectGroupMongoService,
        private readonly securityProfileService: SercurityProfileMongoService,
        private readonly projectMongoService: ProjectMongoService,
        private readonly userService: UserMongoService,
        private readonly viewer3dProfileService: Viewer3DProfileMongoService,
        private readonly projectProfileMongoService: ProjectProfileMongoService,
        private readonly openStreetMapService: OpenStreetMapService,
    ) {}

    @Get('/country')
    async getCountryList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: IQueryDropdown,
    ) {
        try {
            const [items, totalItems] =
                await this.countryService.getCountryList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/group')
    @UseGuards(AuthenticationGuard)
    async getGroupList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownByModuleSchema),
        )
        query: IQueryDropdownByModules,
    ) {
        try {
            const [items, totalItems] = await this.groupService.getGroupList(
                query,
            );
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/project-group')
    @UseGuards(AuthenticationGuard)
    async getProjectGroupList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryProjectDropdownSchema),
        )
        query: IQueryDropdown,
    ) {
        try {
            const [items, totalItems] =
                await this.projectGroupService.getProjectGroupList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/security-profile')
    @UseGuards(AuthenticationGuard)
    async getSecurityProfileList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: IQueryDropdown,
    ) {
        try {
            const [items, totalItems] =
                await this.securityProfileService.getSecurityProfileList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/project-profile')
    @UseGuards(AuthenticationGuard)
    async getProjectProfileList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryProjectDropdownSchema),
        )
        query: IQueryDropdown,
    ) {
        try {
            const [items, totalItems] =
                await this.projectProfileMongoService.getProjectProfileList(
                    query,
                );
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/3d-viewer-profile')
    @UseGuards(AuthenticationGuard)
    async get3dViewerProfileList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownByModuleSchema),
        )
        query: IQueryDropdown,
    ) {
        try {
            const [items, totalItems] =
                await this.viewer3dProfileService.get3DViewerProfileList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('postal-code')
    @UseGuards(AuthenticationGuard)
    async getPostalCodeFromCoordinates(
        @Query(new JoiValidationPipe(getPostalCodeSchema)) body: IGetPostalCode,
    ) {
        try {
            const result =
                await this.openStreetMapService.getCoordinatesDetails(body);
            if (!result.data?.address?.postcode) {
                const message = await this.i18n.t(
                    'project.errors.getPostalCode',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message);
            }
            return new SuccessResponse({
                postalCode: result.data?.address?.postcode,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('coordinates')
    @UseGuards(AuthenticationGuard)
    async getCoordinatesFromPostalCode(
        @Query(new JoiValidationPipe(getCoordinatesSchema))
        body: IGetCoordinates,
    ) {
        try {
            const result =
                await this.openStreetMapService.getCoordinatesFromPostalCode(
                    body,
                );
            if (!result.data?.length) {
                const message = await this.i18n.t(
                    'project.errors.coordinatesNotFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message);
            }
            const placeDetails = result.data?.[0];

            if (!placeDetails?.boundingbox?.length) {
                const message = await this.i18n.t(
                    'project.errors.coordinatesNotFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message);
            }
            const avgLatitude =
                (+placeDetails.boundingbox[0] + +placeDetails.boundingbox[1]) /
                2;
            const avgLongitude =
                (+placeDetails.boundingbox[2] + +placeDetails.boundingbox[3]) /
                2;
            return new SuccessResponse({
                displayName: placeDetails?.displayName,
                coordinates: {
                    latitude: avgLatitude,
                    longitude: avgLongitude,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/user')
    @UseGuards(AuthenticationGuard)
    async getUserList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownByModuleSchema),
        )
        query: IQueryDropdownByModules,
    ) {
        try {
            const { items } = await this.userService.getUserList(query);
            return new SuccessResponse({ items });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/company')
    @UseGuards(AuthenticationGuard)
    async getCompanyList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownByModuleSchema),
        )
        query: IQueryDropdownByModules,
    ) {
        try {
            const { items } = await this.userService.getCompanyList(query);
            return new SuccessResponse({ items });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/project')
    @UseGuards(AuthenticationGuard)
    async getProjectList() {
        try {
            const [items, totalItems] =
                await this.projectMongoService.getAllProjects();
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
