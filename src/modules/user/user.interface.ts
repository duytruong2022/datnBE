import { ObjectId } from 'mongodb';
import {
    AccessModules,
    Languages,
    Timezones,
    UserRoles,
    UserStatus,
    UserTokenTypes,
} from 'src/common/constants';
import { ICommonListQuery } from 'src/common/interfaces';
import { UpdateGroupAction } from '../group/group.constant';
import { UpdateProjectGroupAction } from '../project-group/project-group.constant';
import { RegistrationFrom, UpdateProjectUserAction } from './user.constant';

export interface IUserAccessModule {
    module: AccessModules;
    roles: UserRoles[];
}
export interface IUserCreateBody {
    email: string;
    firstName: string;
    lastName: string;
    ldapUsername: string;
    phoneNumber?: string;
    constellationGroupIds?: ObjectId[];
    viewer3dGroupIds?: ObjectId[];
    projectGroupIds?: ObjectId[];
    securityProfileIds?: ObjectId[];
    viewer3dProfileIds?: ObjectId[];
    projectProfileIds?: ObjectId[];
    language?: Languages;
    timezone?: Timezones;
    countryId: ObjectId;
    city?: string;
    status: UserStatus;
    jobTitle?: string;
    company?: string;
    address?: string;
    accessModules: IUserAccessModule[];
    registrationFrom: RegistrationFrom;
    createdBy: ObjectId;
    ldapDn: string;
    projectId?: ObjectId;
    projects?: IProjectUser[];
    assignedProjectIds?: ObjectId[];
}

export interface IUserUpdateBody {
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    constellationGroupIds?: ObjectId[];
    viewer3dGroupIds?: ObjectId[];
    projectGroupIds?: ObjectId[];
    securityProfileIds?: ObjectId[];
    viewer3dProfileIds?: ObjectId[];
    projectProfileIds?: ObjectId[];
    assignedProjectIds?: ObjectId[];
    language?: Languages;
    timezone?: Timezones;
    countryId?: ObjectId;
    city?: string;
    status?: UserStatus;
    jobTitle?: string;
    company?: string;
    address?: string;
    accessModules?: IUserAccessModule[];
    accessModule?: AccessModules;
    registrationFrom?: RegistrationFrom;
    updatedBy?: string;
    password?: string;
    needToChangePassword?: boolean;
    newPasswordWaitingActice?: string;
    adminProjectIds?: ObjectId[];
    ldapUsername?: string;
    ldapDn?: string;
    projects?: IProjectUser[];
}

export interface IUserUpdateGroupIdsBody {
    isConfirm: boolean;
    action: UpdateGroupAction;
    groupId: ObjectId;
    accessModule: AccessModules;
    updatedBy?: string;
}

export interface IUserListQuery extends ICommonListQuery {
    status?: UserStatus[];
    accessModules?: AccessModules[];
    accessModule?: AccessModules;
    projectId?: ObjectId;
    companies?: string[];
    countryIds?: ObjectId[];
    registrationFrom?: RegistrationFrom[];
    constellationGroupIds?: ObjectId[];
    constellationProfileIds?: ObjectId[];
    viewer3dGroupIds?: ObjectId[];
    viewer3dProfileIds?: ObjectId[];
    projectGroupIds?: ObjectId[];
    projectProfileIds?: ObjectId[];
}

export interface ISetPasswordBody {
    password: string;
    confirmPassword: string;
    assignRandomPassword: boolean;
    needToChangePassword: boolean;
    notificationId?: string;
}

export interface IResetPasswordBody {
    password: string;
    confirmPassword: string;
    assignRandomPassword: boolean;
    needToChangePassword: boolean;
    notificationId: string;
}
export interface IContact {
    userId: string;
    email: string;
    fullName: string;
    subject: string;
    description: string;
}

export interface IBulkCreateUser {
    index?: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    company: string;
    jobTitle: string;
    country: string;
    city: string;
    language: Languages;
    timezone: Timezones;
    groups: string[];
    securityProfiles?: string[];
    viewer3dProfiles?: string[];
    projectProfiles?: string[];
    countryId: string;
    constellationGroupIds?: ObjectId[];
    viewer3dGroupIds?: ObjectId[];
    securityProfileIds: ObjectId[];
    viewer3dProfileIds: ObjectId[];
    projectProfileIds: ObjectId[];
    createdBy: ObjectId;
    registrationFrom: RegistrationFrom;
    accessModules: IUserAccessModule[];
    status: UserStatus;
    password: string;
    projects?: IProjectUser[];
    assignedProjectIds?: ObjectId[];
}

export interface IBulkCreateUserBody {
    users: IBulkCreateUser[];
    accessModule: AccessModules;
    projectId: ObjectId;
}
export interface IUserToken {
    token: string;
    type: UserTokenTypes;
    userId: ObjectId;
    hashToken: string;
    createdBy: ObjectId;
    deletedAt?: Date;
}
export interface IImportLDAPBody {
    ldapUserIds: string[];
    ldapCountryId: string;
    accessModule: AccessModules;
}

export interface IBulkUpdateLdapUser {
    _id: string;
    accessModules: IUserAccessModule[];
    ldapUsername: string;
    ldapDn: string;
    updatedBy: string;
    projects?: IProjectUser[];
    assignedProjectIds?: ObjectId[];
}

export interface IProjectUser {
    projectId: ObjectId;
    projectGroupIds: ObjectId[];
    projectProfileIds: ObjectId[];
    pbsProfiles?: IPbsProfile[];
}

export interface IUserUpdateProjectGroupIdsBody {
    isConfirm: boolean;
    action: UpdateProjectGroupAction;
    projectId: ObjectId;
    projectGroupId: ObjectId;
    accessModule: AccessModules;
    updatedBy?: string;
}

export interface IUserUpdateProjectIdsBody {
    action: UpdateProjectUserAction;
    projectId: ObjectId;
    updatedBy?: string;
}

export interface IGetUnassignedToProjectUser extends ICommonListQuery {
    projectId: ObjectId;
}

export interface IAssignPbsProfileBody {
    projectProfileIds: ObjectId[];
    pbsGroupId: ObjectId;
}

export interface IPbsProfile {
    pbsGroupId: ObjectId;
    projectProfileIds: ObjectId[];
}
