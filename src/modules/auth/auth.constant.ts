export const MODULE_NAME = 'auth';

export enum FormValidation {
    FIRST_NAME_MAX_LENGTH = 40,
    LAST_NAME_MAX_LENGTH = 40,
    USERNAME_MAX_LENGTH = 60,
}

export const profileAttributes = [
    '_id',
    'firstName',
    'lastName',
    'email',
    'ldapUsername',
    'language',
    'timezone',
    'accessModules',
    'phoneNumber',
    'securityProfileIds',
    'status',
    'city',
    'groupIds',
    'company',
    'jobTitle',
    'address',
    'countryId',
    'needToChangePassword',
];

export const MAX_REGISTER_FAILURE = 4;
export const REGISTER_FAILURE_BLOCK_DURATION = 24; // in hours
