import Joi from 'joi';
import {
    AccessModules,
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    MAX_UPLOAD_FILE_SIZE_IN_BYTE,
    Regex,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { INPUT_NAME_MAX_LENGTH } from '../user/user.constant';
import {
    SupportRequestCategory,
    SupportRequestSite,
    SupportRequestOrderBy as SupportRequestOrderBy,
    SupportRequestPriority,
} from './support-request.constant';

export const supportRequestSchema = Joi.object().keys({
    email: Joi.string().regex(Regex.EMAIL).required(),
    firstName: Joi.string()
        .max(INPUT_NAME_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    lastName: Joi.string()
        .max(INPUT_NAME_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    category: Joi.string()
        .valid(...Object.values(SupportRequestCategory))
        .required(),
    priority: Joi.string()
        .valid(...Object.values(SupportRequestPriority))
        .required(),
    version: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    site: Joi.string()
        .valid(...Object.values(SupportRequestSite))
        .required(),
    object: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    reference: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    detail: Joi.string().max(TEXTAREA_MAX_LENGTH).optional().allow(null, ''),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
    file: Joi.object()
        .keys({
            originalname: Joi.string()
                .max(INPUT_TEXT_MAX_LENGTH)
                .optional()
                .allow(null, ''),
            type: Joi.string()
                .max(INPUT_TEXT_MAX_LENGTH)
                .optional()
                .allow(null, ''),
            path: Joi.string()
                .max(INPUT_TEXT_MAX_LENGTH)
                .optional()
                .allow(null, ''),
            filename: Joi.string()
                .max(INPUT_TEXT_MAX_LENGTH)
                .optional()
                .allow(null, ''),
            size: Joi.number()
                .max(MAX_UPLOAD_FILE_SIZE_IN_BYTE)
                .positive()
                .optional(),
        })
        .optional()
        .allow(null),
});

export const supportRequestListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(SupportRequestOrderBy))
        .optional(),
    categories: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestCategory)))
        .optional(),
    sites: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestSite)))
        .optional(),
    priorities: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestPriority)))
        .optional(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const exportSupportRequestListQuerySchema = Joi.object().keys({
    orderBy: Joi.string()
        .valid(...Object.values(SupportRequestOrderBy))
        .optional(),
    categories: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestCategory)))
        .optional(),
    sites: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestSite)))
        .optional(),
    priorities: Joi.array()
        .items(Joi.string().valid(...Object.values(SupportRequestPriority)))
        .optional(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
    socketClientId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});
