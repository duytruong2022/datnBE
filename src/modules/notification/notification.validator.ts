import {
    AccessModules,
    CommonListQuerySchema,
    Regex,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { NotificationStatus } from './notification.constant';
export const NotificationQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    status: Joi.string()
        .valid(...Object.values(NotificationStatus))
        .optional(),
    accessModules: Joi.array()
        .items(Joi.string().valid(...Object.values(AccessModules)))
        .required(),
    projectId: Joi.string().regex(Regex.OBJECT_ID).optional(),
});
export const RejectNotificationSchema = Joi.object().keys({
    rejectReason: Joi.string().max(TEXTAREA_MAX_LENGTH).required(),
});
export const CountPendingNotificationQueryStringSchema = Joi.object().keys({
    accessModules: Joi.array()
        .items(Joi.string().valid(...Object.values(AccessModules)))
        .required(),
});
