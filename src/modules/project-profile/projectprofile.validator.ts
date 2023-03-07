import {
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    Regex,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { ProjectPermissions, ProfileOrderby } from './project-profile.constant';

const profileValidationFields = {
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(ProjectPermissions)))
        .required(),
    description: Joi.string()
        .max(TEXTAREA_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    isDefaultSelect: Joi.boolean().optional().allow(null),
};

export const getProfileSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(ProfileOrderby))
        .optional(),
    projectId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const CreateProfileSchema = Joi.object().keys({
    ...profileValidationFields,
    projectId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const UpdateProfileSchema = Joi.object().keys({
    ...profileValidationFields,
});
