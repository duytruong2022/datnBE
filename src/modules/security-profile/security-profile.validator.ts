import { CommonListQuerySchema } from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { SecurityProfileOrderby } from './security-profile.constant';
import {
    INPUT_TEXT_MAX_LENGTH,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { SecurityPermissions } from './security-profile.constant';

export const getSecurityProfileSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(SecurityProfileOrderby))
        .optional(),
});

const securityValidationFields = {
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(SecurityPermissions)))
        .required(),
    description: Joi.string()
        .max(TEXTAREA_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    isDefaultSelect: Joi.boolean().optional().allow(null),
};

export const CreateSecurityProfileSchema = Joi.object().keys({
    ...securityValidationFields,
});

export const UpdateSecurityProfileSchema = Joi.object().keys({
    ...securityValidationFields,
});
