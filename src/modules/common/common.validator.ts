import {
    AccessModules,
    INPUT_TEXT_MAX_LENGTH,
    MAX_PAGE_LIMIT,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';

export const queryDropdownSchema = Joi.object().keys({
    page: Joi.number().allow(null).positive().optional(),
    limit: Joi.number().allow(null).positive().max(MAX_PAGE_LIMIT).optional(),
});

export const queryProjectDropdownSchema = Joi.object().keys({
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    page: Joi.number().allow(null).positive().optional(),
    limit: Joi.number().allow(null).positive().max(MAX_PAGE_LIMIT).optional(),
});

export const queryDropdownByModuleSchema = Joi.object().keys({
    page: Joi.number().allow(null).positive().optional(),
    limit: Joi.number().allow(null).positive().max(MAX_PAGE_LIMIT).optional(),
    accessModules: Joi.array()
        .items(Joi.string().valid(...Object.values(AccessModules)))
        .optional()
        .allow(null),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
});

export const queryDropdownFileSchema = Joi.object().keys({
    type: Joi.array()
        .items(
            Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
        )
        .optional(),
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});
