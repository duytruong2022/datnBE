import {
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import {
    ProjectPermissions,
    ProfileOrderby,
} from './viewer-3d-profile.constant';

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
});

export const CreateProfileSchema = Joi.object().keys({
    ...profileValidationFields,
});

export const UpdateProfileSchema = Joi.object().keys({
    ...profileValidationFields,
});
