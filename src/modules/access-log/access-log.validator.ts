import Joi from 'src/plugins/joi';

import {
    AccessModules,
    CommonListQuerySchema,
    DateFormat,
    INPUT_TEXT_MAX_LENGTH,
} from 'src/common/constants';
import { AccessLogOrderBy } from './access-log.constant';

export const accessLogListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(AccessLogOrderBy))
        .optional(),
    modules: Joi.array().items(
        Joi.string().valid(...Object.values(AccessModules)),
    ),
    companies: Joi.array().items(Joi.string()),
    loginAtRange: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
});

export const createAccessLogSchema = Joi.object().keys({
    module: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .allow(null || ''),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
});
