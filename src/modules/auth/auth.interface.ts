import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { AccessModules, Languages, Timezones } from 'src/common/constants';
import { RegistrationFrom } from '../user/user.constant';

export interface ILoginForm {
    email: string;
    password: string;
}

export interface ILogoutBody {
    refreshToken: string;
    accessLogId: ObjectId;
}
export interface IRegisterForm {
    firstName: string;
    lastName: string;
    email: string;
    countryId: ObjectId;
    language: Languages;
    module: AccessModules;
    projectName: string;
    projectAdminEmail: string;
    projectId?: Types.ObjectId;
    registrationFrom: RegistrationFrom;
}

export interface IRequestResetPasswordForm {
    email: string;
}

export interface ILoginLdapForm {
    username: string;
    password: string;
}
export interface IUpdateProfileBody {
    firstName: string;
    lastName: string;
    countryId: ObjectId;
    city: string;
    language?: Languages;
    timezone?: Timezones;
    jobTitle?: string;
    phoneNumber?: string;
    company?: string;
    address?: string;
    projectId?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

export interface IActiveUserBody {
    token: string;
}

export interface IResetPasswordBody {
    token: string;
}
export interface IChangePasswordBody {
    currentPassword: string;
    password: string;
}

export interface ILogoutOtherDeviceBody {
    refreshToken: string;
}
