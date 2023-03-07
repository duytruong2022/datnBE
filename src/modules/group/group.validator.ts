import Joi from 'src/plugins/joi';

import {
    AccessModules,
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    INTEGER_POSITIVE_MAX_VALUE,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import { GroupOrderBy, UpdateGroupAction } from './group.constant';
import { UserOrderBy } from '../user/user.constant';

export const groupListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(GroupOrderBy))
        .optional(),
    accessModule: Joi.string().valid(...Object.values(AccessModules)),
    profileIds: Joi.array().items(
        Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    ),
});

export const userNotInGroupListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(UserOrderBy))
        .optional(),
});

export const createGroupSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    securityProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    viewer3dProfileId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    description: Joi.string().max(TEXTAREA_MAX_LENGTH).required(),
    accessModule: Joi.string()
        .valid(...Object.values(AccessModules))
        .required(),
});

export const updateGroupSchema = Joi.object().keys({});

export const updateProjectIdsGroupSchema = Joi.object().keys({
    action: Joi.string()
        .valid(...Object.values(UpdateGroupAction))
        .required(),
    projectId: Joi.isObjectId().required(),
});

export const ImportGroupSchema = Joi.object().keys({
    groups: Joi.array()
        .items(
            Joi.object().keys({
                name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
                securityProfile: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, ''),
                viewer3dProfile: Joi.string()
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
});
