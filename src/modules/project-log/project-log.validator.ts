import Joi from 'src/plugins/joi';
import {
    CommonListQuerySchema,
    DateFormat,
    INPUT_TEXT_MAX_LENGTH,
} from 'src/common/constants';
import {
    LogServerType,
    ProjectLogActions,
    ProjectLogModules,
} from './project-log.constant';

export const projectLogListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    projectIds: Joi.array()
        .items(Joi.string().max(INPUT_TEXT_MAX_LENGTH))
        .optional()
        .allow(null, ''),
    modules: Joi.array()
        .items(Joi.string().valid(...Object.values(ProjectLogModules)))
        .required(),
    actions: Joi.array()
        .items(Joi.string().valid(...Object.keys(ProjectLogActions)))
        .optional()
        .allow(null),
    updatedAtRange: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
});

export const serverLogListQuerySchema = Joi.object().keys({
    date: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required(),
    type: Joi.string()
        .valid(...Object.keys(LogServerType))
        .required(),
});

export const getLogServerDetailSchema = Joi.object().keys({
    path: Joi.string().required(),
});
