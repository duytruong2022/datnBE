import moment from 'moment';
import {
    ARRAY_MAX_LENGTH,
    COLOR_CODE_MAX_LENGTH,
    CommonListQuerySchema,
    DateFormat,
    INPUT_TEXT_MAX_LENGTH,
    INTEGER_POSITIVE_MAX_VALUE,
    INTEGER_POSITIVE_MIN_VALUE,
    Regex,
    TEXTAREA_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import {
    AppearanceType,
    BaselinePlanningOrderBy,
    BaselinePosition,
    GrowthSimulation,
    LATITUDE_MAX_VALUE,
    LATITUDE_MIN_VALUE,
    LinkType,
    LONGITUDE_MAX_VALUE,
    LONGITUDE_MIN_VALUE,
    PlanningOrderBy,
    PreserveTaskFields,
    ProjectCategoires,
    ResourceType,
    TaskConstraint,
    TaskDuration,
    TaskFieldDataType,
    TaskPercentCompleteType,
    TaskPhysicalQuantityUnit,
    TaskStatus,
    TaskType,
    CurrencyType,
    TaskDurationFormat,
    DayTypes,
    CalendarConfigRepeatTypes,
    ProjectNotificationType,
    MilestoneLinkTo,
    ExportObjectList,
    OtherResourceUnit,
    MaterialResourceUnit,
    AssignToExistingResourceOption,
    PlanningStatus,
    AppearanceOptions,
} from './project.constant';

export const projectSchema = {
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    adminId: Joi.string().regex(Regex.OBJECT_ID).required(),
    category: Joi.string()
        .valid(...Object.values(ProjectCategoires))
        .required(),
    description: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    postalCode: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    latitude: Joi.number()
        .min(LATITUDE_MIN_VALUE)
        .max(LATITUDE_MAX_VALUE)
        .required(),
    longitude: Joi.number()
        .min(LONGITUDE_MIN_VALUE)
        .max(LONGITUDE_MAX_VALUE)
        .required(),
};

export const createProjectSchema = Joi.object().keys({
    ...projectSchema,
    timezone: Joi.string().required(),
});

export const updateProfileSchema = Joi.object().keys({
    ...projectSchema,
});

export const updateProjectActivityCodeStatusSchema = Joi.object().keys({
    status: Joi.boolean().required(),
});

export const getPostalCodeSchema = Joi.object().keys({
    latitude: Joi.number()
        .min(LATITUDE_MIN_VALUE)
        .max(LATITUDE_MAX_VALUE)
        .required(),
    longitude: Joi.number()
        .min(LONGITUDE_MIN_VALUE)
        .max(LONGITUDE_MAX_VALUE)
        .required(),
});

export const getCoordinatesSchema = Joi.object().keys({
    postalCode: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    countryCode: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ProjectListQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    category: Joi.string()
        .valid(...Object.values(ProjectCategoires))
        .optional(),
    createdBy: Joi.string().regex(Regex.OBJECT_ID).optional(),
    createdAt: Joi.array()
        .items(Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON))
        .optional()
        .length(2)
        .allow(''),
});

export const PlanningListQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(PlanningOrderBy))
        .optional()
        .allow(null),
    allowSynthesizedPlanning: Joi.boolean().optional(),
});

export const GetListInPlanningQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(PlanningOrderBy))
        .optional()
        .allow(null),
    allowSynthesizedPlanning: Joi.boolean().optional(),
});

export const PlanningQueryStringSchema = Joi.object().keys({
    name: Joi.string().required().max(TEXTAREA_MAX_LENGTH),
    planningFilePath: Joi.string()
        .regex(Regex.FOLDER_PATH)
        .required()
        .max(TEXTAREA_MAX_LENGTH),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UserDefileFieldQueryStringSchema = Joi.object().keys({
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const CreateAdditionalTaskFieldsSchema = Joi.object().keys({
    name: Joi.string()
        .not(...PreserveTaskFields)
        .required()
        .max(TEXTAREA_MAX_LENGTH),
    dataType: Joi.string()
        .valid(...Object.values(TaskFieldDataType))
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateAdditionalTaskFieldsSchema = Joi.object().keys({
    name: Joi.string()
        .not(...PreserveTaskFields)
        .required()
        .max(TEXTAREA_MAX_LENGTH),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const TaskFieldSchema = {
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    parentId: Joi.isObjectId().optional().allow(null, ''),
    status: Joi.string()
        .valid(...Object.values(TaskStatus))
        .required(),
    start: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .when('taskType', {
            is: TaskType.FINISH_MILESTONE,
            then: Joi.required().allow(null),
            otherwise: Joi.required(),
        })
        .required(),
    actualStart: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required()
        .allow(null),
    finish: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .when('taskType', {
            is: TaskType.START_MILESTONE,
            then: Joi.required().allow(null),
            otherwise: Joi.required(),
        })
        .required(),
    actualFinish: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required()
        .allow(null),
    // primaryConstraints: Joi.string()
    //     .valid(...Object.values(TaskConstraint))
    //     .required()
    //     .allow(null),
    // primaryConstraintDate: Joi.date()
    //     .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
    //     .required()
    //     .allow(null),
    durationType: Joi.string()
        .valid(...Object.values(TaskDuration))
        .allow(null),
    remainingDuration: Joi.number().optional().allow(null),

    percentageCompletion: Joi.string()
        .valid(...Object.values(TaskPercentCompleteType))
        .optional()
        .allow(null),
    manualComplete: Joi.number().allow(null).optional(),
    rules: Joi.number().optional().allow(null),
    additionalFields: Joi.object().unknown(true),
    calendarId: Joi.isObjectId().optional().allow(null, ''),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    projectId: Joi.isObjectId().required(),
};

export const CreateTaskSchema = Joi.object().keys({
    ...TaskFieldSchema,
});

export const UpdateTaskSchema = Joi.object().keys({
    ...TaskFieldSchema,
});

export const BulkUpdateTaskSchema = Joi.object().keys({
    items: Joi.array()
        .items(
            Joi.object({
                ...TaskFieldSchema,
                ganttId: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .optional()
                    .allow(null, ''),
                taskId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
                projectId: Joi.isObjectId().optional(),
                path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
            }),
        )
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const PlanningSchema = {
    status: Joi.string()
        .valid(...Object.values(PlanningStatus))
        .optional(),
    name: Joi.string()
        .regex(Regex.FILE_NAME)
        .max(INPUT_TEXT_MAX_LENGTH)
        .required(),
};

export const UpdatePlanningSchema = Joi.object().keys({
    planningId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
    name: Joi.string()
        .regex(Regex.FILE_NAME)
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional(),
    planningFilePath: Joi.string()
        .regex(Regex.FOLDER_PATH)
        .max(TEXTAREA_MAX_LENGTH)
        .optional(),
    taskIdPrefix: Joi.string().max(INPUT_TEXT_MAX_LENGTH).trim().optional(),
    taskIdSuffix: Joi.number()
        .min(INTEGER_POSITIVE_MIN_VALUE)
        .max(INTEGER_POSITIVE_MAX_VALUE)
        .optional(),
    taskIdIncrement: Joi.number()
        .min(INTEGER_POSITIVE_MIN_VALUE)
        .max(INTEGER_POSITIVE_MAX_VALUE)
        .optional(),
    currency: Joi.string()
        .valid(...Object.values(CurrencyType))
        .optional(),
    durationType: Joi.string()
        .valid(...Object.values(TaskDuration))
        .optional(),
    durationFormat: Joi.string()
        .valid(...Object.values(TaskDurationFormat))
        .optional(),
    defaultDuration: Joi.number()
        .min(INTEGER_POSITIVE_MIN_VALUE)
        .max(INTEGER_POSITIVE_MAX_VALUE)
        .optional(),
    projectStart: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .optional(),
    dataDate: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .optional(),
    activityType: Joi.string()
        .valid(...Object.values(TaskType))
        .optional(),
    defaultCalendar: Joi.isObjectId().optional(),
    percentageCompletion: Joi.string()
        .valid(...Object.values(TaskPercentCompleteType))
        .optional(),
    autoScheduling: Joi.boolean().optional(),
});

export const CreatePlanningSchema = Joi.object().keys({
    ...PlanningSchema,
});

export const DelegateTaskSchema = Joi.object().keys({
    ...PlanningSchema,
    taskIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const DelegateTaskToDelegationSchema = Joi.object().keys({
    taskIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateDelegationSchema = Joi.object().keys({
    tasks: Joi.array()
        .items({
            _id: Joi.isObjectId().required(),
            name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
            ganttId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
            planningId: Joi.isObjectId().required(),
            startModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required(),
            finishModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required(),
        })
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateOriginalPlanningSchema = Joi.object().keys({
    tasks: Joi.array()
        .items({
            _id: Joi.isObjectId().required(),
            name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
            ganttId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
            planningId: Joi.isObjectId().required(),
            startModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required(),
            finishModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required(),
        })
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    milestones: Joi.array()
        .items({
            _id: Joi.isObjectId().required(),
            linkedTaskId: Joi.isObjectId().required(),
            milestoneLinkTo: Joi.string()
                .valid(...Object.values(MilestoneLinkTo))
                .required(),
            linkedLinkId: Joi.isObjectId().required(),
            startModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required()
                .allow(null),
            finishModified: Joi.date()
                .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                .required()
                .allow(null),
        })
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const SynthesisPlanningSchema = Joi.object().keys({
    ...PlanningSchema,
    planningIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const CreateLinkSchema = Joi.object().keys({
    source: Joi.isObjectId().required(),
    target: Joi.isObjectId().disallow(Joi.ref('source')).required(),
    type: Joi.string()
        .valid(...Object.values(LinkType))
        .required(),
    lag: Joi.number().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const BulkCreateLinkSchema = Joi.object().keys({
    items: Joi.array()
        .items(
            Joi.object({
                source: Joi.isObjectId().required(),
                target: Joi.isObjectId().disallow(Joi.ref('source')).required(),
                type: Joi.string()
                    .valid(...Object.values(LinkType))
                    .required(),
                lag: Joi.number().required(),
            }),
        )
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});
export const UpdateLinkSchema = Joi.object().keys({
    source: Joi.isObjectId().required(),
    target: Joi.isObjectId().disallow(Joi.ref('source')).required(),
    type: Joi.string()
        .valid(...Object.values(LinkType))
        .required(),
    lag: Joi.number().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const ResourceQueryStringSchema = Joi.object().keys({
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    planningId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const CreateResourceSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    type: Joi.string()
        .valid(...Object.values(ResourceType))
        .required(),
    unit: Joi.string()
        .valid(
            ...Object.values(OtherResourceUnit),
            ...Object.values(MaterialResourceUnit),
        )
        .required(),
    fileIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    planningId: Joi.isObjectId().required(),
    parentId: Joi.isObjectId().optional().allow(null, ''),
    description: Joi.string()
        .max(TEXTAREA_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    calendar: Joi.isObjectId().optional().allow(null, ''),
    workloadAndCapacity: Joi.array()
        .items(
            Joi.object({
                effectiveDate: Joi.date()
                    .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                    .required(),
                unitPerPeriod: Joi.number().required(),
                pricePerUnit: Joi.number().required(),
            }),
        )
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateResourceSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    type: Joi.string()
        .valid(...Object.values(ResourceType))
        .required(),
    unit: Joi.string()
        .valid(
            ...Object.values(OtherResourceUnit),
            ...Object.values(MaterialResourceUnit),
        )
        .required(),
    fileIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    planningId: Joi.isObjectId().required(),
    parentId: Joi.isObjectId().optional().allow(null, ''),
    description: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    calendar: Joi.isObjectId().optional().allow(null, ''),
    workloadAndCapacity: Joi.array()
        .items(
            Joi.object({
                effectiveDate: Joi.date()
                    .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
                    .required(),
                unitPerPeriod: Joi.number().required(),
                pricePerUnit: Joi.number().required(),
            }),
        )
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
    assignToExistingResourceOption: Joi.string()
        .valid(...Object.values(AssignToExistingResourceOption))
        .optional(),
    sessionToken: Joi.string().optional(),
});

export const ResourceGroupQueryStringSchema = Joi.object().keys({
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    planningId: Joi.isObjectId().required(),
    projectId: Joi.isObjectId().required(),
});

export const CreateResourceGroupSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    resourceIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    planningId: Joi.isObjectId().required(),
    description: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateResourceGroupSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    resourceIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    planningId: Joi.isObjectId().required(),
    description: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const UpdateTaskBaselineSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
    taskIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
});

export const baselinePlanningListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(BaselinePlanningOrderBy))
        .optional(),
    planningId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const createBaselinePlanningSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    planningId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const baselineConfigurationQuerySchema = Joi.object().keys({
    planningId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const createBaselineConfigurationSchema = Joi.object().keys({
    display: Joi.boolean().required(),
    color: Joi.string().regex(Regex.COLOR).required(),
    position: Joi.string()
        .valid(...Object.values(BaselinePosition))
        .required(),
});

export const TopDownSchema = Joi.object().keys({
    taskIds: Joi.array().items(Joi.string().regex(Regex.OBJECT_ID)).required(),
    linkIds: Joi.array().items(Joi.string().regex(Regex.OBJECT_ID)).required(),
    planningIds: Joi.array()
        .items(Joi.string().regex(Regex.OBJECT_ID))
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const AssignResourceSchema = Joi.object().keys({
    resourceIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    appearanceProfileIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    taskIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const AssignResourceGroupSchema = Joi.object().keys({
    resourceGroupIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    taskIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    appearanceProfileIds: Joi.array()
        .items(Joi.isObjectId().optional())
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const TaskIdsSchema = Joi.object().keys({
    taskIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const ResetBaselineSchema = Joi.object().keys({
    planningId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const ApplyBaselineSchema = Joi.object().keys({
    baselineId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const FilesByFocusTimeSchema = Joi.object().keys({
    sessionToken: Joi.string().required(),
    planningId: Joi.isObjectId().required(),
    focusTime: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const AppearanceProfileQueryStringSchema = Joi.object().keys({
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    planningId: Joi.isObjectId().required(),
});

export const CreateAppearanceProfileSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    type: Joi.string()
        .valid(...Object.values(AppearanceType))
        .required(),
    growthSimulation: Joi.string()
        .valid(...Object.values(GrowthSimulation))
        .required(),
    startAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyValue: Joi.number().allow(null),
        })
        .optional(),
    activeAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyStartValue: Joi.number().allow(null),
            transparencyInterpolation: Joi.boolean(),
            transparencyEndValue: Joi.number().allow(null),
        })
        .optional(),
    endAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyValue: Joi.number().allow(null),
        })
        .optional(),
    planningId: Joi.isObjectId().required(),
    projectId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const UpdateAppearanceProfileSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    type: Joi.string()
        .valid(...Object.values(AppearanceType))
        .required(),
    growthSimulation: Joi.string()
        .valid(...Object.values(GrowthSimulation))
        .required(),
    planningId: Joi.isObjectId().required(),
    assignFileIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    startAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyValue: Joi.number().allow(null),
            _id: Joi.isObjectId().optional(),
        })
        .optional(),
    activeAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyStartValue: Joi.number().allow(null),
            transparencyInterpolation: Joi.boolean(),
            transparencyEndValue: Joi.number().allow(null),
            _id: Joi.isObjectId().optional(),
        })
        .optional(),
    endAppearanceProfile: Joi.object()
        .keys({
            colorType: Joi.string().valid(...Object.values(AppearanceOptions)),
            colorValue: Joi.string().allow(null, ''),
            transparencyType: Joi.string().valid(
                ...Object.values(AppearanceOptions),
            ),
            transparencyValue: Joi.number().allow(null),
            _id: Joi.isObjectId().optional(),
        })
        .optional(),
    notAssignFileIds: Joi.array()
        .items(Joi.isObjectId().optional().allow(null, ''))
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .optional(),
    projectId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ActivityCodeListQuerySchema = Joi.object().keys({
    projectId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ProjectGetListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    projectId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ActivityCodeValueQuerySchema = Joi.object().keys({
    projectId: Joi.isObjectId().required(),
});

export const ActivityCodeValueSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    description: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .allow(null, ''),
    colorCode: Joi.string()
        .max(COLOR_CODE_MAX_LENGTH)
        .regex(Regex.COLOR)
        .required(),
    parentId: Joi.isObjectId().allow(null).required(),
    projectId: Joi.isObjectId().required(),
    activityCodeId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const ActivityCodeSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).trim().required(),
    maxLength: Joi.number()
        .min(INTEGER_POSITIVE_MIN_VALUE)
        .max(INTEGER_POSITIVE_MAX_VALUE)
        .required(),
    projectId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const AssignActivityCodeSchema = Joi.object().keys({
    activityCodeValueId: Joi.isObjectId().required().allow(null),
    projectId: Joi.isObjectId().required(),
    taskIds: Joi.array()
        .items(Joi.isObjectId().required())
        .unique()
        .max(ARRAY_MAX_LENGTH)
        .required(),
});

export const setProjectFieldSettingSchema = Joi.object().keys({
    category: Joi.boolean().required(),
    description: Joi.boolean().required(),
    postalCode: Joi.boolean().required(),
    address: Joi.boolean().required(),
    coordinates: Joi.boolean().required(),
    projectAdmin: Joi.boolean().required(),
    time: Joi.boolean().required(),
});

export const CreateCalendarSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const CalendarQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    projectId: Joi.string().regex(Regex.OBJECT_ID).required(),
});
export const DayTypeQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    projectId: Joi.string().regex(Regex.OBJECT_ID).required(),
});

export const UpdateCalendarSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const CreateDayTypeSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
    timeBlocks: Joi.array().items(
        Joi.object().keys({
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
        }),
    ),
});

export const UpdateDayTypeSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    timeBlocks: Joi.array().items(
        Joi.object().keys({
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
        }),
    ),
});

export const ConfigDateSchema = Joi.object().keys({
    dayType: Joi.string()
        .valid(...Object.values(DayTypes))
        .required(),
    repeatType: Joi.string()
        .valid(...Object.values(CalendarConfigRepeatTypes))
        .required(),
    workingDayTypeId: Joi.string().allow('', null).optional(),
    date: Joi.date().format(DateFormat.YYYY_MM_DD_HYPHEN).required(),
    timezone: Joi.string().required(),
});

export const GetCalendarConfigSchema = Joi.object().keys({
    startDate: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required(),
    endDate: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_COLON)
        .required(),
});

export const exportPlanningQueryString = Joi.object().keys({
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    planningFilePath: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    socketClientId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const planningByPathNameQueryString = Joi.object().keys({
    projectId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    planningFilePath: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const resourceIdSchema = Joi.object().keys({
    resourceId: Joi.isObjectId().required(),
    path: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    projectId: Joi.isObjectId().required(),
});

export const ProjectNotificationQueryStringSchema = Joi.object().keys({
    ...CommonListQuerySchema,
    type: Joi.string()
        .valid(...Object.values(ProjectNotificationType))
        .optional(),
});

export const exportPlanningToPrimaveraP6Schema = Joi.object().keys({
    projectId: Joi.isObjectId().required(),
    planningId: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    planningName: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    selectedObjects: Joi.array()
        .items(Joi.string().valid(...Object.values(ExportObjectList)))
        .required(),
    fileName: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    savePath: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});

export const importXMLSchema = Joi.object().keys({
    parentTaskId: Joi.isObjectId().required(),
    isReplace: Joi.boolean().required(),
    project: Joi.object()
        .keys({
            name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
            dataDate: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
            p6Id: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
        })
        .required(),
    tasks: Joi.array()
        .items(
            Joi.object().keys({
                p6Id: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                name: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                finish: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                start: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                actualDuration: Joi.number().allow(null).optional(),
                actualFinish: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                actualStart: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                duration: Joi.number().allow(null).optional(),
                parentId: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                milestoneType: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                color: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                primaryConstraints: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                primaryConstraintDate: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
            }),
        )
        .optional(),
    links: Joi.array()
        .items(
            Joi.object().keys({
                source: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                target: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                type: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
            }),
        )
        .optional(),
    resources: Joi.array()
        .items(
            Joi.object().keys({
                p6Id: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                name: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
                type: Joi.string()
                    .max(INPUT_TEXT_MAX_LENGTH)
                    .allow(null, '')
                    .optional(),
            }),
        )
        .optional(),
});
export const RenameTaskSchema = Joi.object().keys({
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
});
