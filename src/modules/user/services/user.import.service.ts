import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../mongo-schemas/user.schema';
import { MODULE_NAME, RegistrationFrom } from '../user.constant';
import {
    AccessModules,
    HttpStatus,
    softDeleteCondition,
    UserRoles,
    UserStatus,
} from 'src/common/constants';
import {
    IBulkCreateUser,
    IBulkUpdateLdapUser,
    IUserCreateBody,
} from '../user.interface';
import { ObjectId } from 'mongodb';
import {
    Country,
    CountryDocument,
} from 'src/common/mongo-schemas/country.schema';
import {
    Group,
    GroupDocument,
} from 'src/modules/group/mongo-schemas/group.schema';
import {
    SecurityProfile,
    SecurityProfileDocument,
} from 'src/modules/security-profile/mongo-schemas/security-profile.schema';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { hashPassword } from 'src/common/helpers/commonFunctions';
import {
    Viewer3dProfile,
    Viewer3dProfileDocument,
} from 'src/modules/3D-viewer-profile/mongo-schemas/viewer-3d-profile.schema';
import {
    ProjectProfile,
    ProjectProfileDocument,
} from 'src/modules/project-profile/mongo-schemas/project-profile.schema';
import {
    ProjectGroup,
    ProjectGroupDocument,
} from 'src/modules/project-group/mongo-schemas/project-group.schema';

@Injectable()
export class ImportUserService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(Country.name)
        private readonly countryModel: Model<CountryDocument>,
        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
        @InjectModel(SecurityProfile.name)
        private readonly securityProfileModule: Model<SecurityProfileDocument>,
        @InjectModel(Viewer3dProfile.name)
        private readonly viewer3dProfileModule: Model<Viewer3dProfileDocument>,
        @InjectModel(ProjectProfile.name)
        private readonly projectProfileModule: Model<ProjectProfileDocument>,
        private readonly i18n: I18nRequestScopeService,
        @InjectModel(ProjectGroup.name)
        private readonly projectGroupModel: Model<ProjectGroupDocument>,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getUserEmails(emails: string[]) {
        try {
            const users = await this.userModel
                .find({
                    ...softDeleteCondition,
                    email: { $in: emails },
                })
                .select('email');
            return users.map((user) => user.email);
        } catch (error) {
            this.logger.error('Error in getUserEmails service', error);
        }
    }

    async getCountryByCode(code: string): Promise<CountryDocument> {
        try {
            return await this.countryModel.findOne({
                ...softDeleteCondition,
                code,
            });
        } catch (error) {
            this.logger.error('Error in getCountryByCode service', error);
            throw error;
        }
    }

    async getCountryById(_id: string): Promise<CountryDocument> {
        try {
            return await this.countryModel.findOne({
                ...softDeleteCondition,
                _id,
            });
        } catch (error) {
            this.logger.error('Error in getCountryById service', error);
            throw error;
        }
    }

    async getUserCountries(countries: string[]) {
        try {
            const countryList = await this.countryModel
                .find({
                    ...softDeleteCondition,
                    name: { $in: countries },
                })
                .select('name');
            return countryList;
        } catch (error) {
            this.logger.error('Error in getUserCountries service', error);
            throw error;
        }
    }

    async getUserGroups(groups: string[], accessModule: AccessModules) {
        try {
            const groupList = await this.groupModel
                .find({
                    ...softDeleteCondition,
                    name: { $in: groups },
                    accessModule: accessModule,
                })
                .select('name');
            return groupList;
        } catch (error) {
            this.logger.error('Error in getUserGroups service', error);
            throw error;
        }
    }

    async getUserProjectGroups(
        groups: string[],
        accessModule: AccessModules,
        projectId: ObjectId,
    ) {
        try {
            const groupList = await this.projectGroupModel
                .find({
                    ...softDeleteCondition,
                    name: { $in: groups },
                    accessModule: accessModule,
                    projectId,
                })
                .select('name');
            return groupList;
        } catch (error) {
            this.logger.error('Error in getUserGroups service', error);
            throw error;
        }
    }

    async getUserSecurityProfiles(securityProfiles: string[]) {
        try {
            const securityProfileList = await this.securityProfileModule
                .find({
                    ...softDeleteCondition,
                    name: { $in: securityProfiles },
                })
                .select('name');
            return securityProfileList;
        } catch (error) {
            this.logger.error(
                'Error in getUserSecurityProfiles service',
                error,
            );
            throw error;
        }
    }

    async getUserViewer3dProfiles(viewer3dProfiles: string[]) {
        try {
            const viewer3dProfileList = await this.viewer3dProfileModule
                .find({
                    ...softDeleteCondition,
                    name: { $in: viewer3dProfiles },
                })
                .select('name');
            return viewer3dProfileList;
        } catch (error) {
            this.logger.error(
                'Error in getUserViewer3dProfiles service',
                error,
            );
            throw error;
        }
    }

    async getUserProjectProfiles(projectProfiles: string[]) {
        try {
            const projectProfileList = await this.projectProfileModule
                .find({
                    ...softDeleteCondition,
                    name: { $in: projectProfiles },
                })
                .select('name');
            return projectProfileList;
        } catch (error) {
            this.logger.error('Error in getUserProjectProfiles service', error);
            throw error;
        }
    }

    async validateImportUser(
        importUser: IBulkCreateUser,
        emails: string[],
        countries: Country[],
        groups?: Group[],
        projectGroup?: ProjectGroup[],
        securityProfiles?: SecurityProfile[],
        viewer3dProfiles?: Viewer3dProfile[],
        projectProfiles?: ProjectProfile[],
        accessModule?: AccessModules,
        projectId?: ObjectId,
    ) {
        try {
            const validationResult = {
                isValid: true,
                errors: [],
            };

            if (emails.includes(importUser.email)) {
                const errorMessage = await this.i18n.translate(
                    'user.import.email.duplicate',
                );
                validationResult.errors.push({
                    column: 'email',
                    errorMessage,
                    errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                });
                validationResult.isValid = false;
            }

            if (
                !countries
                    .map((country) => country.name)
                    .includes(importUser.country)
            ) {
                const errorMessage = await this.i18n.translate(
                    'user.import.country.notFound',
                );
                validationResult.errors.push({
                    column: 'country',
                    errorMessage,
                    errorCode: HttpStatus.ITEM_NOT_FOUND,
                });
                validationResult.isValid = false;
            }

            if (importUser.groups?.length) {
                let isErrorGroup = false;
                let groupNames: string[] = [];
                if (
                    projectId &&
                    accessModule === AccessModules.SPACIALYTIC_CONSTELLATION
                ) {
                    groupNames = projectGroup.map((group) => group.name);
                } else {
                    groupNames = groups.map((group) => group.name);
                }
                importUser.groups.forEach((group) => {
                    if (!groupNames.includes(group)) {
                        isErrorGroup = true;
                    }
                });
                if (isErrorGroup) {
                    const errorMessage = await this.i18n.translate(
                        'user.import.group.notFound',
                    );
                    validationResult.errors.push({
                        column: 'groups',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            if (importUser.securityProfiles?.length) {
                let isErrorSecurityProfile = false;
                const securityProfileNames = securityProfiles.map(
                    (securityProfile) => securityProfile.name,
                );
                importUser.securityProfiles.forEach((securityProfile) => {
                    if (!securityProfileNames.includes(securityProfile)) {
                        isErrorSecurityProfile = true;
                    }
                });
                if (isErrorSecurityProfile) {
                    const errorMessage = await this.i18n.translate(
                        'user.import.securityProfile.notFound',
                    );
                    validationResult.errors.push({
                        column: 'securityProfiles',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            if (importUser.viewer3dProfiles?.length) {
                let isErrorViewer3dProfile = false;
                const viewer3dProfileNames = viewer3dProfiles.map(
                    (viewer3dProfile) => viewer3dProfile.name,
                );
                importUser.viewer3dProfiles.forEach((viewer3dProfile) => {
                    if (!viewer3dProfileNames.includes(viewer3dProfile)) {
                        isErrorViewer3dProfile = true;
                    }
                });
                if (isErrorViewer3dProfile) {
                    const errorMessage = await this.i18n.translate(
                        'user.import.viewer3dProfile.notFound',
                    );
                    validationResult.errors.push({
                        column: 'viewer3dProfiles',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            if (importUser.projectProfiles?.length) {
                let isErrorProjectProfile = false;
                const projectProfileNames = projectProfiles.map(
                    (projectProfile) => projectProfile.name,
                );
                importUser.projectProfiles.forEach((projectProfile) => {
                    if (!projectProfileNames.includes(projectProfile)) {
                        isErrorProjectProfile = true;
                    }
                });
                if (isErrorProjectProfile) {
                    const errorMessage = await this.i18n.translate(
                        'user.import.projectProfile.notFound',
                    );
                    validationResult.errors.push({
                        column: 'projectProfiles',
                        errorMessage,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    });
                    validationResult.isValid = false;
                }
            }

            return { validationResult, index: importUser.index };
        } catch (error) {
            this.logger.error('Error in validateImportUser service', error);
            throw error;
        }
    }

    mapImportUser(
        importUser: IBulkCreateUser,
        countries: CountryDocument[],
        createdBy: ObjectId,
        accessModule: AccessModules,
        groups?: GroupDocument[],
        projectGroups?: ProjectGroupDocument[],
        securityProfiles?: SecurityProfileDocument[],
        viewer3dProfiles?: Viewer3dProfileDocument[],
        projectProfiles?: ProjectProfileDocument[],
        projectId?: ObjectId,
    ) {
        try {
            const country = countries.find(
                (country) => country.name === importUser.country,
            );
            if (country) {
                importUser.countryId = country._id;
            }

            if (accessModule === AccessModules.SPACIALYTIC_PLATFORM) {
                importUser.accessModules = [
                    {
                        module: AccessModules.SPACIALYTIC_PLATFORM,
                        roles: [UserRoles.ADMIN],
                    },
                ];
            } else if (
                accessModule === AccessModules.SPACIALYTIC_CONSTELLATION &&
                projectId
            ) {
                const projectGroupIds: ObjectId[] = [];
                importUser?.groups?.forEach((groupName) => {
                    const projectGroup = projectGroups?.find(
                        (gr) => gr.name === groupName,
                    );
                    if (projectGroup) {
                        projectGroupIds.push(projectGroup._id);
                    }
                });

                const projectProfileIds: ObjectId[] = [];
                importUser?.projectProfiles?.forEach((projectProfileName) => {
                    const projectProfile = projectProfiles?.find(
                        (profile) => profile.name === projectProfileName,
                    );
                    if (projectProfile) {
                        projectProfileIds.push(projectProfile._id);
                    }
                });

                importUser.projects = [
                    {
                        projectId: new ObjectId(projectId),
                        projectProfileIds,
                        projectGroupIds,
                    },
                ];

                importUser.accessModules = [
                    {
                        module: accessModule,
                        roles: [UserRoles.NORMAL_USER],
                    },
                ];

                importUser.assignedProjectIds = [new ObjectId(projectId)];
            } else if (
                accessModule === AccessModules.SPACIALYTIC_CONSTELLATION &&
                !projectId
            ) {
                const constellationGroupIds: ObjectId[] = [];
                importUser?.groups?.forEach((groupName) => {
                    const group = groups?.find((gr) => gr.name === groupName);
                    if (group) {
                        constellationGroupIds.push(group._id);
                    }
                });
                importUser.constellationGroupIds = constellationGroupIds;

                const securityProfileIds: ObjectId[] = [];
                importUser?.securityProfiles?.forEach((securityProfileName) => {
                    const securityProfile = securityProfiles?.find(
                        (profile) => profile.name === securityProfileName,
                    );
                    if (securityProfile) {
                        securityProfileIds.push(securityProfile._id);
                    }
                });
                importUser.securityProfileIds = securityProfileIds;

                importUser.accessModules = [
                    {
                        module: accessModule,
                        roles: [UserRoles.NORMAL_USER],
                    },
                ];
            } else {
                const viewer3dGroupIds: ObjectId[] = [];
                importUser?.groups?.forEach((groupName) => {
                    const group = groups?.find((gr) => gr.name === groupName);
                    if (group) {
                        viewer3dGroupIds.push(group._id);
                    }
                });
                importUser.viewer3dGroupIds = viewer3dGroupIds;

                const viewer3dProfileIds: ObjectId[] = [];
                importUser?.viewer3dProfiles?.forEach((viewer3dProfileName) => {
                    const viewer3dProfile = viewer3dProfiles?.find(
                        (profile) => profile.name === viewer3dProfileName,
                    );
                    if (viewer3dProfile) {
                        viewer3dProfileIds.push(viewer3dProfile._id);
                    }
                });
                importUser.viewer3dProfileIds = viewer3dProfileIds;

                importUser.accessModules = [
                    {
                        module: accessModule,
                        roles: [UserRoles.NORMAL_USER],
                    },
                ];
            }

            return {
                ...importUser,
                registrationFrom: RegistrationFrom.CSV_IMPORT,
                status: UserStatus.ACTIVE,
                createdBy,
                password: hashPassword(importUser.password),
                needToChangePassword: true,
            };
        } catch (error) {
            this.logger.error('Error in mapImportUser service', error);
            throw error;
        }
    }

    async bulkCreateUsers(importUsers: IBulkCreateUser[]) {
        try {
            await this.userModel.insertMany(importUsers);
        } catch (error) {
            this.logger.error('Error in bulkCreateUsers service', error);
            throw error;
        }
    }

    async bulkLdapCreateUsers(importUsers: IUserCreateBody[]) {
        try {
            await this.userModel.insertMany(importUsers);
        } catch (error) {
            this.logger.error('Error in bulkCreateUsers service', error);
            throw error;
        }
    }

    async bulkUpdateUsers(updateUsers: IBulkUpdateLdapUser[]) {
        try {
            const updateOperations = updateUsers.map((item) => {
                return {
                    updateOne: {
                        filter: {
                            _id: item._id,
                            ...softDeleteCondition,
                        },
                        update: {
                            accessModules: item.accessModules,
                            ldapUsername: item.ldapUsername,
                            ldapDn: item.ldapDn,
                            status: UserStatus.ACTIVE,
                            updatedBy: item.updatedBy,
                            projects: item.projects,
                            assignedProjectIds: item.assignedProjectIds,
                        },
                    },
                };
            });
            await this.userModel.bulkWrite([...updateOperations]);
        } catch (error) {
            this.logger.error('Error in bulkCreateUsers service', error);
            throw error;
        }
    }
}
