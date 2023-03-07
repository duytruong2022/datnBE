import {
    AccessModules,
    DateFormat,
    INPUT_TEXT_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { DateRangeTypes } from './log-report.constant';

export const userTimeListQuerySchema = Joi.object().keys({
    company: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    dateRanges: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
    dateRangeType: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .valid(...Object.values(DateRangeTypes))
        .required(),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
});

export const supportRequestCategoryListQuerySchema = Joi.object().keys({
    dateRanges: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
    dateRangeType: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .valid(...Object.values(DateRangeTypes))
        .required(),
});

export const userStatusListQuerySchema = Joi.object().keys({
    company: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    module: Joi.string()
        .valid(...Object.values(AccessModules))
        .optional()
        .allow(null),
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
});

export const userInCompanyListQuerySchema = Joi.object().keys({
    projectId: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    dateRanges: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
    dateRangeType: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .valid(...Object.values(DateRangeTypes))
        .required(),
});
