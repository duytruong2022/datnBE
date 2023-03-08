import {
    Regex,
    INPUT_TEXT_MAX_LENGTH,
    Languages,
    AccessModules,
    Timezones,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { ACCOUNT_ACTIVATION_KEY_LENGTH } from '../user/user.constant';
import { FormValidation } from './auth.constant';

export const loginSchema = Joi.object().keys({
    email: Joi.string()
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .max(INPUT_TEXT_MAX_LENGTH)
        .required(),
    password: Joi.string()
        .regex(Regex.PASSWORD)
        .min(PASSWORD_MIN_LENGTH)
        .max(PASSWORD_MAX_LENGTH)
        .required(),
});

export const registerFormSchema = Joi.object().keys({
    firstName: Joi.string()
        .max(FormValidation.FIRST_NAME_MAX_LENGTH)
        .required(),
    lastName: Joi.string().max(FormValidation.LAST_NAME_MAX_LENGTH).required(),
    email: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .required(),
    countryId: Joi.string()
        .regex(Regex.OBJECT_ID, 'auth.errors.auth.countryId.invalid')
        .required(),
    language: Joi.string()
        .valid(...Object.values(Languages))
        .required(),
    module: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const requestResetPasswordFormSchema = Joi.object().keys({
    email: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.EMAIL, 'auth.errors.auth.email.invalid')
        .required(),
});

export const loginLdapSchema = Joi.object().keys({
    username: Joi.string().max(FormValidation.USERNAME_MAX_LENGTH).required(),
    password: Joi.string().required(),
});
export const updateProfileSchema = Joi.object().keys({
    firstName: Joi.string()
        .max(FormValidation.FIRST_NAME_MAX_LENGTH)
        .required(),
    lastName: Joi.string().max(FormValidation.LAST_NAME_MAX_LENGTH).required(),
    countryId: Joi.isObjectId().required(),
    language: Joi.string()
        .valid(...Object.values(Languages))
        .optional()
        .allow(null, ''),
    timezone: Joi.string()
        .valid(...Object.values(Timezones))
        .allow(null, ''),
    city: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    jobTitle: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    phoneNumber: Joi.string()
        .regex(Regex.PHONE_NUMBER)
        .optional()
        .allow(null, ''),
    company: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    address: Joi.string().max(TEXTAREA_MAX_LENGTH).optional().allow(null, ''),
});

export const logoutSchema = Joi.object().keys({
    accessLogId: Joi.isObjectId().required(),
    refreshToken: Joi.string().required(),
});

export const activeUserSchema = Joi.object().keys({
    token: Joi.string().length(ACCOUNT_ACTIVATION_KEY_LENGTH).required(),
});

export const resetPasswordSchema = Joi.object().keys({
    token: Joi.string().length(ACCOUNT_ACTIVATION_KEY_LENGTH).required(),
});

export const changePasswordFormSchema = Joi.object().keys({
    currentPassword: Joi.string().optional().allow('', null),
    confirmPassword: Joi.string()
        .regex(RegExp(Regex.PASSWORD))
        .min(PASSWORD_MIN_LENGTH)
        .max(PASSWORD_MAX_LENGTH)
        .optional(),
    password: Joi.string()
        .regex(RegExp(Regex.PASSWORD))
        .required()
        .min(PASSWORD_MIN_LENGTH)
        .max(PASSWORD_MAX_LENGTH)
        .regex(Regex.PASSWORD),
});

export const logoutOtherDeviceSchema = Joi.object().keys({
    refreshToken: Joi.string().required(),
});
