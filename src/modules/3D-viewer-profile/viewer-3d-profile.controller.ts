import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'bson';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import {
    ICreateProfileBody,
    IGetListProfileQueryString,
    IUpdateProfileBody,
} from './viewer-3d-profile.interface';
import {
    CreateProfileSchema,
    getProfileSchema,
    UpdateProfileSchema,
} from './viewer-3d-profile.validator';
import { ProfileService } from './services/viewer-3d-profile.mongo.service';
import { GroupMongoService } from '../group/services/group.mongo.service';
import { UserMongoService } from '../user/services/user.mongo.service';

@UseGuards(AuthenticationGuard)
@Controller('/3d-viewer-profile')
export class Viewer3DProfileController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly profileService: ProfileService,
        private readonly groupService: GroupMongoService,
        private readonly userService: UserMongoService,
    ) {}

    @Get('/')
    async get3DViewerProfileList(
        @Query(new JoiValidationPipe(getProfileSchema))
        query: IGetListProfileQueryString,
    ) {
        try {
            const profiles = await this.profileService.getProfileList(query);
            return new SuccessResponse(profiles);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async get3DViewerProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
    ) {
        try {
            const profile = await this.profileService.getProfileById(_id);
            return new SuccessResponse(profile);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    async create3DViewerProfile(
        @Req() req,
        @Body(new JoiValidationPipe(CreateProfileSchema))
        body: ICreateProfileBody,
    ) {
        try {
            body.createdBy = new ObjectId(req.loginUser?._id);
            const nameExists = await this.profileService.checkProfileNameExists(
                body.name,
            );
            if (nameExists) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.item.name.exists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const profile = await this.profileService.createProfile(body);
            return new SuccessResponse(profile);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    async delete3DViewerProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
    ) {
        try {
            const profile = await this.profileService.getProfileById(_id);
            if (!profile) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.item.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const isViewer3dProfileAssignedToGroup =
                await this.groupService.check3DViewerProfileInUsed(profile._id);
            if (isViewer3dProfileAssignedToGroup) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.delete.item.alreadyAssigned.group',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }
            const isViewer3dProfileAssignedToUser =
                await this.userService.checkIf3DViewerProfileInUse(profile._id);
            if (isViewer3dProfileAssignedToUser) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.delete.item.alreadyAssigned.user',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }
            await this.profileService.deleteProfile(
                _id,
                new ObjectId(req.loginUser?._id),
            );
            return new SuccessResponse({ _id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async update3DViewerProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
        @Body(new JoiValidationPipe(UpdateProfileSchema))
        body: IUpdateProfileBody,
    ) {
        try {
            body.updatedBy = new ObjectId(req.loginUser?._id);
            const profile = await this.profileService.getProfileById(_id);
            if (!profile) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.item.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const nameExists = await this.profileService.checkProfileNameExists(
                body.name,
                _id,
            );
            if (nameExists) {
                const message = await this.i18n.t(
                    '3d-viewer-profile.item.name.exists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const updatedResults = await this.profileService.updateProfile(
                _id,
                body,
            );
            return new SuccessResponse(updatedResults);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
