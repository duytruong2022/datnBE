import Joi from 'src/plugins/joi';

import {
    ARRAY_MAX_LENGTH,
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    Languages,
    Regex,
    TEXTAREA_MAX_LENGTH,
    Timezones,
    AccessModules,
    UserRoles,
    UserStatus,
    INTEGER_POSITIVE_MAX_VALUE,
} from 'src/common/constants';
import { UpdateGroupAction } from '../group/group.constant';
import {
    INPUT_NAME_MAX_LENGTH,
    RegistrationFrom,
    UpdateProjectUserAction,
    UserOrderBy,
} from './user.constant';
import { UpdateProjectGroupAction } from '../project-group/project-group.constant';

export const userListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(UserOrderBy))
        .optional(),
    accessModules: Joi.array()
        .items(Joi.string().valid(...Object.values(AccessModules)))
        .optional()
        .allow(null),
    status: Joi.array()
        .items(Joi.string().valid(...Object.values(UserStatus)))
        .optional()
        .allow(null),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    registrationFrom: Joi.array()
        .items(Joi.string().valid(...Object.values(RegistrationFrom)))
        .optional()
        .allow(null),
    companies: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    countryIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    constellationGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    constellationProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    viewer3dGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    viewer3dProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    projectGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    projectProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
});

export const createUserSchema = Joi.object().keys({
    email: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .required(),
    firstName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
    lastName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
    phoneNumber: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.PHONE_NUMBER)
        .optional()
        .allow(null, ''),
    constellationGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .optional()
        .allow(null),
    viewer3dGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    projectGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    securityProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    projectProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    viewer3dProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    language: Joi.string()
        .valid(...Object.values(Languages))
        .optional()
        .allow('', null),
    timezone: Joi.string()
        .valid(...Object.values(Timezones))
        .allow('', null),
    countryId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    city: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow('', null),
    jobTitle: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow('', null),
    company: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow('', null),
    address: Joi.string().max(TEXTAREA_MAX_LENGTH).optional().allow('', null),
    accessModules: Joi.array()
        .items(
            Joi.object().keys({
                module: Joi.string()
                    .valid(...Object.values(AccessModules))
                    .optional()
                    .allow(null, ''),
                roles: Joi.array().items(
                    Joi.string()
                        .valid(...Object.values(UserRoles))
                        .optional(),
                ),
            }),
        )
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    registrationFrom: Joi.string()
        .valid(...Object.values(RegistrationFrom))
        .optional()
        .allow(null, ''),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
});

export const updateUserSchema = Joi.object().keys({
    email: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .required(),
    firstName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
    lastName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
    phoneNumber: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.PHONE_NUMBER)
        .optional()
        .allow(null, ''),
    constellationGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    viewer3dGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    projectGroupIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    securityProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    projectProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    viewer3dProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .max(ARRAY_MAX_LENGTH)
        .allow(null)
        .optional(),
    language: Joi.string()
        .valid(...Object.values(Languages))
        .optional()
        .allow('', null),
    timezone: Joi.string()
        .valid(...Object.values(Timezones))
        .allow('', null),
    countryId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    city: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow('', null),
    jobTitle: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow('', null),
    company: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow('', null),
    address: Joi.string().max(TEXTAREA_MAX_LENGTH).optional().allow('', null),
    accessModules: Joi.array()
        .items(
            Joi.object().keys({
                module: Joi.string()
                    .valid(...Object.values(AccessModules))
                    .optional()
                    .allow(null, ''),
                roles: Joi.array().items(
                    Joi.string()
                        .valid(...Object.values(UserRoles))
                        .optional(),
                ),
            }),
        )
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .optional()
        .allow(null, ''),
});

export const updateGroupIdsUserSchema = Joi.object().keys({
    isConfirm: Joi.boolean(),
    action: Joi.string()
        .valid(...Object.values(UpdateGroupAction))
        .required(),
    groupId: Joi.isObjectId().required(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const setPasswordFormSchema = Joi.object().keys({
    notificationId: Joi.isObjectId().optional(),
    password: Joi.string()
        .allow('', null)
        .trim()
        .when('assignRandomPassword', {
            is: false,
            then: Joi.string()
                .regex(RegExp(Regex.PASSWORD))
                .required()
                .regex(Regex.PASSWORD),
        }),
    confirmPassword: Joi.string().optional().allow('', null),
    assignRandomPassword: Joi.boolean().required(),
    needToChangePassword: Joi.boolean()
        .required()
        .when('password', {
            is: Joi.exist(),
            then: Joi.boolean().allow(true),
        }),
});

export const resetPasswordFormSchema = Joi.object().keys({
    password: Joi.string()
        .allow('', null)
        .trim()
        .when('assignRandomPassword', {
            is: false,
            then: Joi.string()
                .regex(RegExp(Regex.PASSWORD))
                .required()
                .regex(Regex.PASSWORD),
        }),
    confirmPassword: Joi.string().optional().allow('', null),
    assignRandomPassword: Joi.boolean().required(),
    needToChangePassword: Joi.boolean()
        .required()
        .when('password', {
            is: Joi.exist(),
            then: Joi.boolean().allow(true),
        }),
    notificationId: Joi.string().optional().allow('', null),
});

export const contactUserSchema = Joi.object().keys({
    email: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .required(),
    subject: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    description: Joi.string().max(TEXTAREA_MAX_LENGTH).required(),
    fullName: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ImportUserSchema = Joi.object().keys({
    users: Joi.array()
        .items(
            Joi.object().keys({
                index: Joi.number()
                    .min(0)
                    .max(INTEGER_POSITIVE_MAX_VALUE)
                    .required(),
                email: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
                    .required(),
                firstName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
                lastName: Joi.string().max(INPUT_NAME_MAX_LENGTH).required(),
                phoneNumber: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .optional()
                    .regex(Regex.PHONE_NUMBER)
                    .allow(null, ''),
                company: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .optional()
                    .allow('', null),
                jobTitle: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .optional()
                    .allow('', null),
                country: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
                city: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .optional()
                    .allow('', null),
                language: Joi.string()
                    .valid(...Object.values(Languages))
                    .optional()
                    .allow('', null),
                timezone: Joi.string()
                    .valid(...Object.values(Timezones))
                    .allow('', null),
                groups: Joi.array()
                    .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
                    .max(ARRAY_MAX_LENGTH)
                    .optional(),
                securityProfiles: Joi.array()
                    .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
                    .max(ARRAY_MAX_LENGTH)
                    .optional(),
                projectProfiles: Joi.array()
                    .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
                    .max(ARRAY_MAX_LENGTH)
                    .optional(),
                viewer3dProfiles: Joi.array()
                    .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
                    .max(ARRAY_MAX_LENGTH)
                    .optional(),
                address: Joi.string()
                    .max(TEXTAREA_MAX_LENGTH)
                    .optional()
                    .allow('', null),
            }),
        )
        .unique('email', { ignoreUndefined: true }),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .optional()
        .allow(null),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow('', null),
});

export const updateProjectGroupIdsUserSchema = Joi.object().keys({
    isConfirm: Joi.boolean(),
    action: Joi.string()
        .valid(...Object.values(UpdateProjectGroupAction))
        .required(),
    projectId: Joi.isObjectId().required(),
    projectGroupId: Joi.isObjectId().required(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const updateUserProjectIdsSchema = Joi.object().keys({
    action: Joi.string()
        .valid(...Object.values(UpdateProjectUserAction))
        .required(),
    projectId: Joi.isObjectId().required(),
});

export const getUserNotInProject = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(UserOrderBy))
        .optional(),
    accessModules: Joi.array()
        .items(Joi.string().valid(...Object.values(AccessModules)))
        .optional()
        .allow(null),
    status: Joi.array()
        .items(Joi.string().valid(...Object.values(UserStatus)))
        .optional()
        .allow(null),
    projectId: Joi.string().required(),
});

export const assignPbsProfileSchema = Joi.object().keys({
    projectProfileIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null),
    pbsGroupId: Joi.isObjectId().required(),
});
