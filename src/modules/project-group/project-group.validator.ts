import Joi from 'src/plugins/joi';

import {
    AccessModules,
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    INTEGER_POSITIVE_MAX_VALUE,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { ProjectGroupOrderBy } from './project-group.constant';
import { UserOrderBy } from '../user/user.constant';

export const projectGroupListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(ProjectGroupOrderBy))
        .optional(),
    accessModule: Joi.string().valid(...Object.values(AccessModules)),
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    profileIds: Joi.array().items(
        Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    ),
});

export const createProjectGroupSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    description: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const updateProjectGroupSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    description: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const updateGroupSchema = Joi.object().keys({});

export const updateProfileGroupSchema = Joi.object().keys({
    securityProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    viewer3dProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
});

export const importProjectGroupSchema = Joi.object().keys({
    groups: Joi.array()
        .items(
            Joi.object().keys({
                name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
                projectProfile: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, ''),
                description: Joi.string().max(TEXTAREA_MAX_LENGTH).required(),
                index: Joi.number()
                    .min(0)
                    .max(INTEGER_POSITIVE_MAX_VALUE)
                    .required(),
            }),
        )
        .unique('name', { ignoreUndefined: true }),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const userNotInProjectGroupSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(UserOrderBy))
        .optional(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const updateProjectGroupProfileSchema = Joi.object().keys({
    projectProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
});
