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
import { ProjectGroupMongoService } from '../project-group/services/project-group.mongo.service';
import {
    ProjectLogActions,
    ProjectLogModules,
} from '../project-log/project-log.constant';
import { ProjectLogMongoService } from '../project-log/services/project-log.service';
import { ProjectMongoService } from '../project/services/project.mongo.service';
import { UserMongoService } from '../user/services/user.mongo.service';
import {
    ICreateProfileBody,
    IGetListProfileQueryString,
    IUpdateProfileBody,
} from './project-profile.interface';
import {
    CreateProfileSchema,
    getProfileSchema,
    UpdateProfileSchema,
} from './projectprofile.validator';
import { ProfileService } from './services/project-profile.mongo.service';

@UseGuards(AuthenticationGuard)
@Controller('/project-profile')
export class ProfileController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly profileService: ProfileService,
        private readonly projectService: ProjectMongoService,
        private readonly projectGroupService: ProjectGroupMongoService,
        private readonly projectLogService: ProjectLogMongoService,
        private readonly userService: UserMongoService,
    ) {}

    @Get('/')
    async getProjectProfileList(
        @Query(new JoiValidationPipe(getProfileSchema))
        query: IGetListProfileQueryString,
    ) {
        try {
            // TODO: check if user has permission to view this project
            const profiles = await this.profileService.getProfileList(query);
            return new SuccessResponse(profiles);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    async getProjectProfile(
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
    async createProjectProfile(
        @Req() req,
        @Body(new JoiValidationPipe(CreateProfileSchema))
        body: ICreateProfileBody,
    ) {
        try {
            body.createdBy = new ObjectId(req.loginUser?._id);
            const project = await this.projectService.getProjectById(
                body.projectId,
            );
            if (!project) {
                const message = await this.i18n.t(
                    'project-profile.item.project.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'projectId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                    },
                ]);
            }
            const nameExists = await this.profileService.checkProfileNameExists(
                body.name,
                project._id,
            );
            if (nameExists) {
                const message = await this.i18n.t(
                    'project-profile.item.name.exists',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const profile = await this.profileService.createProfile({
                ...body,
                projectId: new ObjectId(body.projectId),
            });
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_PROFILE,
                action: ProjectLogActions.CREATE_PROJECT_PROFILE,
                newData: profile as unknown as Record<string, unknown>,
                projectId: new ObjectId(body.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(profile);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    async updateProjectProfile(
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
                    'project-profile.item.profile.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const nameExists = await this.profileService.checkProfileNameExists(
                body.name,
                profile.projectId,
                _id,
            );
            if (nameExists) {
                const message = await this.i18n.t(
                    'project-profile.item.name.exists',
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
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_PROFILE,
                action: ProjectLogActions.UPDATE_PROJECT_PROFILE,
                newData: updatedResults as unknown as Record<string, unknown>,
                oldData: profile as unknown as Record<string, unknown>,
                projectId: new ObjectId(profile.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse(updatedResults);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    async deleteProjectProfile(
        @Req() req,
        @Param('id', new ParseObjectIdPipe()) _id: ObjectId,
    ) {
        try {
            const profile = await this.profileService.getProfileById(_id);
            if (!profile) {
                const message = await this.i18n.t(
                    'project-profile.item.profile.notFound',
                );
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const isProjectProfileAssignedToGroup =
                await this.projectGroupService.checkProjectProfileInUsed(
                    profile._id,
                );
            if (isProjectProfileAssignedToGroup) {
                const message = await this.i18n.t(
                    'project-profile.delete.item.alreadyAssigned.group',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }
            const isProjectProfileAssignedToUser =
                await this.userService.checkIfProjectProfileInUse(profile._id);

            if (isProjectProfileAssignedToUser) {
                const message = await this.i18n.t(
                    'project-profile.delete.item.alreadyAssigned.user',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message);
            }

            await this.profileService.deleteProfile(
                _id,
                new ObjectId(req.loginUser?._id),
            );
            this.projectLogService.createProjectLog({
                module: ProjectLogModules.PROJECT_PROFILE,
                action: ProjectLogActions.DELETE_PROJECT_PROFILE,
                oldData: profile as unknown as Record<string, unknown>,
                projectId: new ObjectId(profile.projectId),
                description: '',
                createdBy: new ObjectId(req?.loginUser?._id),
            });
            return new SuccessResponse({ _id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
