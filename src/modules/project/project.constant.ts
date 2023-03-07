export const MODULE_NAME = 'project';
export const MILLISECOND_PER_DAY = 1000 * 60 * 60 * 24;
export const LATITUDE_MIN_VALUE = -90;
export const LATITUDE_MAX_VALUE = 90;
export const LONGITUDE_MIN_VALUE = -180;
export const LONGITUDE_MAX_VALUE = 180;
export const TASK_MAX_DURATION = 876600; // the number of hours in 100 years
export const TASK_MAX_CHILDREN = 100; // TODO update later base on specifications

export const projectAttributes = [
    'name',
    'dataDate',
    'category',
    'description',
    'postalCode',
    'longitude',
    'latitude',
    'createdAt',
    'coordinatesDetails',
    'createdAt',
    'updatedAt',
    'adminId',
    'taskIdPrefix',
    'taskIdSuffix',
    'taskIdIncrement',
    'displayActivityCode',
    'dataDate',
];

export const taskListAttributes = [
    '_id',
    'ganttId',
    'name',
    'parentId',
    'parentGanttId',
    'planningId',
    'delegatedTo',
    'taskType',
    'status',
    'createdAt',
    'start',
    'actualStart',
    'plannedStart',
    'baselineStart',
    'finish',
    'actualFinish',
    'plannedFinish',
    'baselineFinish',
    'primaryConstraints',
    'primaryConstraintDate',
    'expectedFinish',
    'durationType',
    'originalDuration',
    'plannedDuration',
    'actualDuration',
    'remainingDuration',
    'percentageCompletion',
    'manualComplete',
    'physicalQuantityUnit',
    'physicalQuantity',
    'actualPhysicalQuantity',
    'rules',
    'isMilestoneFolder',
    'milestoneType',
    'synthesizedFromTaskId',
    'milestoneLinkTo',
    'inheritedFromTaskId',
    'linkedTaskId',
    'isTopDown',
    'isTopDownFolder',
    'resourceIds',
    'resourceGroupIds',
    'appearanceProfileId',
    'canEdit',
    'activityCodeValueId',
    'additionalFields',
    'clonedFromTaskId',
    'linkedLinkId',
    'isStaticMilestone',
    'calendarId',
    'isSynthesizedToOtherTask',
    'color',
];

export const planningAttributes = [
    '_id',
    'name',
    'status',
    'planningId',
    'projectId',
    'taskLinks',
    'createdAt',
    'isTemplate',
    'additionalTaskFields',
    'synthesizedFromPlanningIds',
    'clonedFromPlanningIds',
    'appliedBaselineId',
    'isSynthesized',
    'taskIdPrefix',
    'taskIdSuffix',
    'taskIdIncrement',
    'taskIdCounter',
    'currency',
    'durationType',
    'durationFormat',
    'defaultDuration',
    'activityType',
    'percentageCompletion',
    'projectStart',
    'dataDate',
    'defaultCalendar',
    'autoScheduling',
    'p6Id',
    'disableTopdownAndBottomup',
    'deletedLinkIdsBottomup',
    'deletedLinkIdsTopdown',
    'delegatedFromPlanningId',
];

export const taskLinkListAttributes = ['source', 'target', 'type', '_id'];
export const OPEN_STREET_MAP_REVERSE_COORDINATES_URL =
    'https://nominatim.openstreetmap.org/reverse';
export const OPEN_STREET_MAP_SEARCH_POSTAL_CODE_URL =
    'https://nominatim.openstreetmap.org/search.php';
export const DEFAULT_PROJECT_PAGE_LIMIT = 1000;

export enum ProjectOrderBy {
    NAME = 'name',
    POSTAL_CODE = 'postalCode',
    CREATED_AT = 'createdAt',
}

export enum TaskOrderBy {
    NAME = 'name',
    START_DATE = 'startDate',
    CREATED_AT = 'createdAt',
}

export enum LinkOrderBy {
    CREATED_AT = 'createdAt',
}

export enum LinkDependency {
    PREDECESSOR = 'predecessor',
    SUCCESSOR = 'successor',
}

export enum BaselinePlanningOrderBy {
    NAME = 'name',
    CREATED_AT = 'createdAt',
}

export enum TaskConstraint {
    // As Soon As Possible
    ASAP = 'asap',
    // As Late As Possible
    ALAP = 'alap',
    // Start No Earlier Than
    SNET = 'snet',
    // Start No Later Than
    SNLT = 'snlt',
    // Finish No Earlier Than
    FNET = 'fnet',
    // Finish No Later Than
    FNLT = 'fnlt',
    // Must Start On
    MSO = 'mso',
    // Must Finish On
    MFO = 'mfo',
}

export enum TaskDuration {
    STANDARD = 'standard',
    RESOURCE_UNITS_DEPENDENT = 'resource_units_dependent',
    PHYSICAL_QUANTITY_DEPENDENT = 'physical_quantity_dependent',
}

export enum TaskPercentCompleteType {
    PHYSICAL_COMPLETE = 'physical_complete',
    DURATION_COMPLETE = 'duration_complete',
    MANUAL_COMPLETE = 'manual_complete',
}

export enum TaskPhysicalQuantityUnit {
    BAG = 'bag',
    BOX = 'box',
    BUCKET = 'bucket',
    BUNDLE = 'bundle',
    CRANE = 'crane',
    CARTON = 'carton',
    CUBIC_FEET = 'cubic_feet',
    CUBIC_METRE = 'cubic_METRE',
    CUBIC_YARD = 'cubic_yard',
    DOZEN = 'dozen',
    FEET = 'feet',
    GRAMME = 'gramme',
    HOUR = 'hour',
    ITEM = 'item',
    KILO = 'kilo',
    LENGTH = 'length',
    LITRE = 'litre',
    METRE = 'metre',
    MILLIMETRE = 'millimetre',
    PACK = 'pack',
    PAIR = 'pair',
    PERSON = 'person',
    POUND = 'pound',
    SACHET = 'sachet',
    SET = 'set',
    SHEET = 'sheet',
    SQ_FOOT = 'sq_foot',
    SQ_METRE = 'sq_metre',
    SQ_YARD = 'sq_yard',
    TON = 'ton',
}

export enum MaterialResourceUnit {
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

export enum OtherResourceUnit {
    BAG = 'bag',
    BOX = 'box',
    BUCKET = 'bucket',
    BUNDLE = 'bundle',
    CRANE = 'crane',
    CARTON = 'carton',
    CUBIC_FEET = 'cubic_feet',
    CUBIC_METRE = 'cubic_METRE',
    CUBIC_YARD = 'cubic_yard',
    DOZEN = 'dozen',
    FEET = 'feet',
    GRAMME = 'gramme',
    HOUR = 'hour',
    ITEM = 'item',
    KILO = 'kilo',
    LENGTH = 'length',
    LITRE = 'litre',
    METRE = 'metre',
    MILLIMETRE = 'millimetre',
    PACK = 'pack',
    PAIR = 'pair',
    PERSON = 'person',
    POUND = 'pound',
    SACHET = 'sachet',
    SET = 'set',
    SHEET = 'sheet',
    SQ_FOOT = 'sq_foot',
    SQ_METRE = 'sq_metre',
    SQ_YARD = 'sq_yard',
    TON = 'ton',
}

export enum PlanningOrderBy {
    NAME = 'name',
    CREATED_AT = 'createdAt',
}

export enum PlanningStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PLANNED = 'planned',
}

export enum ProjectCategoires {
    INFRASTRUCTURE = 'infrastructure',
    BUILDINGS_AND_FACILITIES = 'buildingsAndFacilities',
    COMMUNICATIONS = 'communications',
    MAPPING_AND_SURVEYING = 'mappingAndSurveying',
    MINING = 'mining',
    OIL_AND_GAS = 'oilAndGas',
    POWER_GENERATION = 'powerGeneration',
    WATER_AND_WASTEWATER = 'waterAndWastewater',
    MANUFACTURING = 'manufacturing',
}

export enum TaskType {
    STANDARD = 'standard',
    RESOURCE_DEPENDENT = 'resource_dependent',
    START_MILESTONE = 'start_milestone',
    FINISH_MILESTONE = 'finish_milestone',
    LEVEL_EFFORT = 'level_effort',
    WBS_SUMMARY = 'wbs_summary',
    MILESTONE = 'milestone',
}

export enum LinkType {
    START_TO_START = 'start_to_start',
    START_TO_FINISH = 'start_to_finish',
    FINISH_TO_START = 'finish_to_start',
    FINISH_TO_FINISH = 'finish_to_finish',
}

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    FINISHED = 'finished',
}

export enum BaselinePosition {
    TOP = 'top',
    BOTTOM = 'bottom',
    AROUND = 'around',
}

export const BaselineColor = '#FFD180';

export const InitAbsFolderNames = ['4D-Project', '4DBox-Project'];

export enum ResourceType {
    EQUIPMENT = 'equipment',
    HUMAN_RESOURCE = 'human_resource',
    MATERIAL = 'material',
    LOCATION = 'location',
}

export const TopDownFolderName = 'Top-down';
export const BottomUpFolderName = 'Bottom-up';

export enum MilestoneType {
    TOP_DOWN = 'topDown',
    BOTTOM_UP = 'bottomUp',
    TOP_DOWN_DELEGATE_IM = 'topDownDelegateIM',
    TOP_DOWN_DELEGATE_FL = 'topDownDelegateFL',
    TOP_DOWN_DELEGATE_CF = 'topDownDelegateCF',
    BOTTOM_UP_DELEGATE_IM = 'bottomUpDelegateIM',
    BOTTOM_UP_DELEGATE_FL = 'bottomUpDelegateFL',
    BOTTOM_UP_DELEGATE_CF = 'bottomUpDelegateCF',
}

export enum MilestoneLinkTo {
    START = 'start',
    FINISH = 'finish',
}
export const InitTemplateTasks = [
    {
        name: TopDownFolderName,
        isMilestoneFolder: true,
        milestoneType: MilestoneType.TOP_DOWN,
    },
    { name: 'Content' },
    {
        name: BottomUpFolderName,
        isMilestoneFolder: true,
        milestoneType: MilestoneType.BOTTOM_UP,
    },
];

export enum TaskFieldDataType {
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    STRING = 'string',
    DATE_TIME = 'date_time',
}

export const PreserveTaskFields = [
    'Activity ID',
    'Activity status',
    'Activity type',
    'WBS code',
    'WBS name',
    'Activity name',
    'Calendar name',
    'Start',
    'Actual start',
    'Early start',
    'Late start',
    'Planned start',
    'BL start',
    'Finish',
    'Actual finish',
    'Early finish',
    'Late finish',
    'Planned finish',
    'BL finish',
    'Primary constraint',
    'Primary constraint date',
    'Expected finish',
    'Duration type',
    'Planned duration',
    'Original duration',
    'Actual duration',
    'Remaining duration',
    'At complete duration',
    'BL duration',
    'Variance - BL duration',
    'Variance - BL Finish Date',
    'Variance - BL Start Date',
    'Free float',
    'Total float',
    'Critical',
    'Percent complete type',
    'Physical % Complete',
    'Duration % Complete',
    'Manual % Complete',
    'Physical quantity unit',
    'Physical quantity',
    'Actual physical quantity',
    'Remaining physical quantity',
    'Rules',
    'Activity code',
    'Appreance profile',
    'Resource 3D',
    'Resource group',
    'All columns',
];
export enum AppearanceType {
    INSTALL = 'install',
    MAINTAIN = 'maintain',
    REMOVE = 'remove',
    TEMPORARY = 'temporary',
}

export enum GrowthSimulation {
    BOTTOM_TOP = 'bottom_top',
    TOP_BOTTOM = 'top_bottom',
    LEFT_RIGHT = 'left_right',
    RIGHT_LEFT = 'right_left',
    FRONT_BACK = 'front_back',
    BACK_FRONT = 'back_front',
}

export enum DayTypes {
    WORKING_DAY = 'workingDay',
    NONE_WORKING_DAY = 'noneWorkingDay',
}

export enum CalendarConfigRepeatTypes {
    ONLY_THIS_DATE = 'onlyThisDate',
    ALL_SAME_WEEK_DAY_THIS_MONTH = 'allSameWeekDayThisMonth',
    ALL_SAME_WEEK_DAY_THIS_YEAR = 'allSameWeekDayThisYear',
    ALL_SAME_WEEK_DAY = 'allSameWeekDay',
    GREATER_THAN_OR_EQUAL_TO_THIS_DATE = 'greaterThanOrEqualToThisDate',
    LESS_THAN_OR_EQUAL_TO_THIS_DATE = 'lessThanOrEqualToThisDate',
}

export const NumberOfDaysPerWeek = 7;
export const MaximumRepeatYears = 3;

export enum ProjectNotificationType {
    RESET_BASELINE = 'resetBaseline',
    APPLY_BASELINE = 'applyBaseline',
    CREATE_TASK_FIELD = 'createTaskField',
    UPDATE_TASK_FIELD = 'updateTaskField',
    DELETE_TASK_FIELD = 'deleteTaskField',
    UPDATE_PLANNING = 'updatePlanning',
    DELETE_PLANNING = 'deletePlanning',
    CREATE_RESOURCE = 'createResource',
    CREATE_RESOURCE_GROUP = 'createResourceGroup',
    ASSIGN_RESOURCE = 'assignResource',
    DELETE_APPEARANCE_PROFILE = 'deleteAppearanceProfile',
    UPDATE_APPEARANCE_PROFILE = 'updateAppearanceProfile',
    CREATE_APPEARANCE_PROFILE = 'createAppearanceProfile',
    DELETE_RESOURCE_GROUP = 'deleteResourceGroup',
    UPDATE_RESOURCE_GROUP = 'updateResourceGroup',
    UPDATE_RESOURCE = 'updateResource',
    DELETE_RESOURCE = 'deleteResource',
    CREATE_BASELINE = 'createBaseline',
    UPDATE_BASELINE = 'updateBaseline',
    DELETE_BASELINE = 'deleteBaseline',
    UPDATE_BASELINE_CONFIGURATION = 'updateBaselineConfiguration',
    CREATE_ACTIVITY_CODE_VALUE = 'createActivityCodeValue',
    UPDATE_ACTIVITY_CODE_VALUE = 'updateActivityCodeValue',
    DELETE_ACTIVITY_CODE_VALUE = 'deleteActivityCodeValue',
    ASSIGN_ACTIVITY_CODE_VALUE = 'assignActivityCodeValue',
    CREATE_ACTIVITY_CODE = 'createActivityCode',
    UPDATE_ACTIVITY_CODE = 'updateActivityCode',
    DELETE_ACTIVITY_CODE = 'deleteActivityCode',

    DELEGATE = 'delegate',
    SYNTHESIS = 'synthesis',
    CREATE_TASK = 'createTask',
    CREATE_LINK = 'createLink',
    DELETE_LINK = 'deleteLink',
    UPDATE_LINK = 'updateLink',
    UPDATE_TASK = 'updateTask',
    DELETE_TASK = 'deleteTask',
    TOP_DOWN = 'topDown',
    BOTTOM_UP = 'bottomUp',
}

export const MilestoneLinkToOption = {
    [MilestoneLinkTo.START]: 'I',
    [MilestoneLinkTo.FINISH]: 'O',
};
export const contentFolderName = 'Content';
export const defaultTaskDuration = 5;

export enum CurrencyType {
    DOLLAR = 'dollar',
    EURO = 'euro',
}

export enum TaskDurationFormat {
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

export enum MilestoneColor {
    FLOATING_TD_BU = '#ff9f9f',
    MANDATORY_TD_BU = '#00b050',
    MANDATORY_DELEGATE = '#3b8b92',
    FLOATING_DELEGATE = '#ffff00',
    UPDATE = '#ffc000',
}

export const defaultProjectCalendarName = 'Default calendar';
export const defaultCalendarHoursPerDay = 8;
export const defaultCalendarHoursPerWeek = 40;
export const defaultCalendarHoursPerMonth = 172;
export const defaultCalendarHoursPerYear = 2000;
export const defaultDayTypeName = 'Full day';
export const defaultWorkingTimes = [
    {
        startTime: '09:00',
        endTime: '18:00',
    },
];
export const defaultCalendarDays = [
    { name: 'Sunday', isWorkingDay: false },
    { name: 'Monday', isWorkingDay: true },
    { name: 'Tuesday', isWorkingDay: true },
    { name: 'Wednesday', isWorkingDay: true },
    { name: 'Thursday', isWorkingDay: true },
    { name: 'Friday', isWorkingDay: true },
    { name: 'Saturday', isWorkingDay: false },
];
export const defaultExportUserFieldSubjectArea = 'Activity';
export const exportUserFieldValueSuffix = 'Value';

export enum XML_TYPE {
    MSP = 'mps',
    P6 = 'p6',
}

export enum ExportScope {
    GLOBAL = 'Global',
    PROJECT = 'Project',
}

export enum ExportObjectList {
    TASKS = 'tasks',
    LINKS = 'links',
    RESOURCES = 'resources',
    RESOURCE_ASSIGNMENTS = 'resource_assignments',
    ACTIVITY_CODES = 'activity_codes',
    ACTIVITY_CODE_ASSIGNMENTS = 'activity_code_assignments',
    USER_FIELDS = 'user_fields',
    USER_FIELD_VALUES = 'user_field_values',
    CALENDARS = 'calendars',
}

export const convertExportXmlPlanning = {
    [XML_TYPE.P6]: {
        ActivityIdPrefix: 'taskIdPrefix',
        ActivityIdSuffix: 'taskIdSuffix',
        ActivityIdIncrement: 'taskIdIncrement',
        DataDate: 'dataDate',
        PlannedStartDate: 'projectStart',
    },
};

export const convertExportXmlWbs = {
    [XML_TYPE.P6]: {
        Code: 'ganttId',
        Name: 'name',
        StartDate: 'start',
        FinishDate: 'finish',
        OriginalDuration: 'originalDuration',
        PlannedDuration: 'plannedDuration',
        ActualDuration: 'actualDuration',
        RemainingDuration: 'remainingDuration',
    },
};

export const convertExportXmlTask = {
    [XML_TYPE.P6]: {
        Id: 'ganttId',
        Name: 'name',
        Status: 'status',
        Type: 'taskType',
        StartDate: 'start',
        FinishDate: 'finish',
        ExpectedFinishDate: 'expectedFinish',
        ActualStartDate: 'actualStart',
        ActualFinishDate: 'actualFinish',
        PlannedStartDate: 'plannedStart',
        PlannedFinishDate: 'plannedFinish',
        PercentCompleteType: 'percentageCompletion',
        DurationType: 'durationType',
        OriginalDuration: 'originalDuration',
        ActualDuration: 'actualDuration',
        PlannedDuration: 'plannedDuration',
        RemainingDuration: 'remainingDuration',
        PrimaryConstraintType: 'primaryConstraints',
        PrimaryConstraintDate: 'primaryConstraintDate',
        milestoneType: 'milestoneType',
        color: 'color',
        primaryConstraints: 'primaryConstraints',
    },
};

export const convertExportXmlResource = {
    [XML_TYPE.P6]: {
        Name: 'name',
        ResourceType: 'type',
    },
};

export const convertExportXmlActivityCodeType = {
    [XML_TYPE.P6]: {
        Name: 'name',
        Length: 'maxLength',
        Description: 'description',
    },
};

export const convertExportXmlActivityCode = {
    [XML_TYPE.P6]: {
        CodeValue: 'name',
        Color: 'colorCode',
        Description: 'description',
    },
};

export const convertExportXmlUserField = {
    [XML_TYPE.P6]: {
        Title: 'name',
        DataType: 'dataType',
    },
};

export const convertExportXmlCalendar = {
    [XML_TYPE.P6]: {
        Name: 'name',
    },
};

export const convertExportXmlLinkType = {
    [XML_TYPE.P6]: {
        [LinkType.START_TO_START]: 'Start to Start',
        [LinkType.START_TO_FINISH]: 'Start to Finish',
        [LinkType.FINISH_TO_START]: 'Finish to Start',
        [LinkType.FINISH_TO_FINISH]: 'Finish to Finish',
    },
};

export const convertExportXmlTaskType = {
    [XML_TYPE.P6]: {
        [TaskType.STANDARD]: 'Task Dependent',
        [TaskType.RESOURCE_DEPENDENT]: 'Resource Dependent',
        [TaskType.START_MILESTONE]: 'Start Milestone',
        [TaskType.FINISH_MILESTONE]: 'Finish Milestone',
        [TaskType.LEVEL_EFFORT]: 'Level of Effort',
        [TaskType.WBS_SUMMARY]: 'WBS Summary',
        [TaskType.MILESTONE]: 'Milestone',
    },
};

export const convertExportXmlTaskStatus = {
    [XML_TYPE.P6]: {
        [TaskStatus.TODO]: 'Not Started',
        [TaskStatus.IN_PROGRESS]: 'In Progress',
        [TaskStatus.FINISHED]: 'Completed',
    },
};

export const convertExportXmlPercentComplete = {
    [XML_TYPE.P6]: {
        [TaskPercentCompleteType.MANUAL_COMPLETE]: 'Units',
        [TaskPercentCompleteType.DURATION_COMPLETE]: 'Duration',
        [TaskPercentCompleteType.PHYSICAL_COMPLETE]: 'Physical',
    },
};

export const convertExportXmlResourceType = {
    [XML_TYPE.P6]: {
        [ResourceType.EQUIPMENT]: 'Nonlabor',
        [ResourceType.HUMAN_RESOURCE]: 'Labor',
        [ResourceType.MATERIAL]: 'Material',
        [ResourceType.LOCATION]: '',
    },
};

export const convertExportXmlUserFieldType = {
    [XML_TYPE.P6]: {
        [TaskFieldDataType.BOOLEAN]: 'Boolean',
        [TaskFieldDataType.DATE_TIME]: 'DateTime',
        [TaskFieldDataType.NUMBER]: 'Double',
        [TaskFieldDataType.STRING]: 'Text',
    },
};

export const ExportXmlUserFieldDateType = {
    [XML_TYPE.P6]: ['DateTime'],
};

export const convertExportXmlTaskConstraints = {
    [XML_TYPE.P6]: {
        [TaskConstraint.ALAP]: 'As Late As Possible',
        [TaskConstraint.ASAP]: 'As Soon As Possible',
        [TaskConstraint.FNET]: 'Finish On or After',
        [TaskConstraint.FNLT]: 'Finish On or Before',
        [TaskConstraint.MFO]: 'Finish On',
        [TaskConstraint.MSO]: 'Start On',
        [TaskConstraint.SNET]: 'Start On or After',
        [TaskConstraint.SNLT]: 'Start On or Before',
    },
};
export enum AppearanceOptions {
    CUSTOM = 'Custom',
    ORIGINAL = 'Original',
}

export enum AssignToExistingResourceOption {
    ASSIGN_TO_RESOURCE_WITHOUT_BUILDING_TREE = 'assignToResourceWithoutBuildingTree',
    ASSIGN_TO_RESOURCE_UNDERNEATH_WITHOUT_BUILDING_TREE = 'assignToResourceUnderneathWithoutBuildingTree',
    ASSIGN_TO_RESOURCE_BUILD_TREE = 'assignToResourceUnderneathBuildTree',
}
