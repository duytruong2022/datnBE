import { ObjectId } from 'mongodb';
import { OrderBy, OrderDirection } from 'src/common/constants';
import { ICommonListQuery } from 'src/common/interfaces';
import {
    AppearanceOptions,
    AppearanceType,
    AssignToExistingResourceOption,
    CalendarConfigRepeatTypes,
    DayTypes,
    ExportObjectList,
    GrowthSimulation,
    LinkType,
    MaterialResourceUnit,
    MilestoneColor,
    MilestoneLinkTo,
    MilestoneType,
    OtherResourceUnit,
    PlanningOrderBy,
    ProjectCategoires,
    ProjectNotificationType,
    ResourceType,
    TaskConstraint,
    TaskDuration,
    TaskFieldDataType,
    TaskPercentCompleteType,
    TaskPhysicalQuantityUnit,
    TaskStatus,
    TaskType,
} from './project.constant';
export interface IGetPostalCode {
    latitude: number;
    longitude: number;
}
export interface IGetCoordinates {
    postalCode: string;
    countryCode: string;
}

export interface IProject {
    name: string;
    adminId: ObjectId;
    dataDate: Date;
    description: string;
    category: ProjectCategoires;
    postalCode: string;
    latitude: number;
    longitude: number;
    coordinatesDetails?: string;
    taskIdPrefix: string;
    taskIdSuffix: number;
    taskIdIncrement: number;
    displayActivityCode?: boolean;
    createdBy?: ObjectId;
    updatedBy?: string;
}

export interface ICreateProject extends IProject {
    planningId: string;
    planningName: string;
    timezone: string;
}

export interface IPlanning {
    name: string;
    planningFilePath: string;
    currency: string;
    durationType: string;
    durationFormat: string;
    defaultDuration: number;
    activityType: string;
    percentageCompletion: string;
    defaultCalendar: ObjectId;
    autoScheduling: boolean;
    disableTopdownAndBottomup: boolean;
}

export interface IUpdatePlanning extends IPlanning {
    updatedBy: ObjectId;
}

export interface IUpdateProjectActivityCodeStatus {
    status: boolean;
    updatedBy?: ObjectId;
}

export interface IGetProjectQueryString extends ICommonListQuery {
    category?: ProjectCategoires;
    createdBy?: ObjectId;
    createdAt?: string;
    accessibleProjectIds: ObjectId[] | null;
}

export interface IGetPlanningQueryString {
    planningFilePath: string;
    name: string;
    projectId?: ObjectId;
    path?: string;
}

export interface IGetUserDefineFiledQueryString {
    projectId: ObjectId;
    path: string;
}

export interface IPlanningListQuery extends ICommonListQuery {
    orderBy: PlanningOrderBy;
    keyword?: string;
}

export interface IUpdateTaskBody {
    name?: string;
    ganttId?: string;
    parentId?: ObjectId;
    parentGanttId?: string | null;
    taskType?: TaskType;
    status?: TaskStatus;
    start?: Date;
    actualStart?: Date | null;
    plannedStart?: Date | null;
    baselineStart?: Date | null;
    finish?: Date;
    actualFinish?: Date | null;
    plannedFinish?: Date | null;
    baselineFinish?: Date | null;

    primaryConstraints?: TaskConstraint | null;
    primaryConstraintDate?: Date | null;
    expectedFinish?: Date | null;
    durationType?: TaskDuration | null;
    originalDuration?: number | null;
    actualDuration?: number | null;
    remainingDuration?: number | null;
    plannedDuration?: number | null;

    percentageCompletion?: TaskPercentCompleteType | null;
    manualComplete?: number | null;
    physicalQuantityUnit?: TaskPhysicalQuantityUnit;
    physicalQuantity?: number | null;
    actualPhysicalQuantity?: number | null;
    rules?: number | null;
    linkedTaskId?: ObjectId;
    isStaticMilestone?: boolean;
    activityCodeValueId?: string | null;
    updatedBy?: ObjectId;

    additionalFields?: Record<string, any>;

    projectId?: ObjectId;
    calendarId?: ObjectId;
    path?: string;
}

export interface ICreateTaskBody extends Omit<IUpdateTaskBody, 'updatedBy'> {
    createdBy?: ObjectId;
    isMilestoneFolder?: boolean;
    milestoneType?: MilestoneType;
    milestoneLinkTo?: MilestoneLinkTo;
    inheritedFromTaskId?: ObjectId;
    planningId?: ObjectId;
    canEdit?: boolean;
    linkedLinkId?: ObjectId;
    color?: string;
    _id?: ObjectId | null;
    clonedFromTaskId?: ObjectId | null;
}

export interface IBulkUpdateTask extends IUpdateTaskBody {
    taskId: ObjectId;
}

export interface IBulkUpdateTaskBody {
    items: IBulkUpdateTask[];
    projectId?: ObjectId;
    path?: string;
}

export interface ICreatePlanningBody extends IPlanning {
    createdBy?: ObjectId;
}

export interface IDelegateTaskBody extends IPlanning {
    taskIds: ObjectId[];
    createdBy?: ObjectId;
    projectId?: ObjectId;
    path?: string;
}

export interface IDelegateTaskToDelegationBody {
    taskIds: ObjectId[];
    createdBy?: ObjectId;
    projectId: ObjectId;
    path: string;
}

export interface ITaskUpdateDelegation {
    _id: ObjectId;
    name: string;
    ganttId: string;
    planningId: ObjectId;
    startModified: Date;
    finishModified: Date;
}

export interface IMilestoneUpdateOriginalPlanning {
    _id: ObjectId;
    // task linked in synthesis planning
    linkedTaskId: ObjectId;
    milestoneLinkTo: MilestoneLinkTo;
    linkedLinkId: ObjectId;
    startModified: Date | null;
    finishModified: Date | null;
}

export interface ISynthesisPlanningBody extends IPlanning {
    planningIds: ObjectId[];
    createdBy?: ObjectId;
    projectId?: ObjectId;
    path?: string;
}

export interface ICreateLinkBody {
    source: string;
    target: string;
    type: LinkType;
    lag: number;
    projectId?: ObjectId;
    path?: string;
    createdBy?: ObjectId;
}

export interface IBulkCreateLinkBody {
    items: ICreateLinkBody[];
    projectId?: ObjectId;
    path?: string;
    createdBy?: ObjectId;
}
export interface IUpdateLinkBody extends ICreateLinkBody {
    updatedBy?: ObjectId;
}

export interface ILinkDetail {
    dependency: string;
    taskLinkToId: string;
    taskLinkToGanttId: string;
    taskLinkToName: string;
    taskLinkToStart: Date | null;
    taskLinkToFinish: Date | null;
    type: LinkType;
    taskLag: number;
}

interface IResourceWorkloadAndCapacity {
    effectiveDate: Date;
    unitPerPeriod: number;
    pricePerUnit: number;
}

export interface ICreateResourceBody {
    _id?: ObjectId;
    name: string;
    type: ResourceType;
    unit: MaterialResourceUnit | OtherResourceUnit;
    planningId: ObjectId;
    fileIds: ObjectId[];
    projectId?: ObjectId;
    path?: string;
    description?: string;
    createdBy?: ObjectId;
    parentId?: ObjectId;
    calendar: ObjectId;
    workloadAndCapacity: IResourceWorkloadAndCapacity[];
}

export interface IUpdateResourceBody {
    name: string;
    type: ResourceType;
    unit: MaterialResourceUnit | OtherResourceUnit;
    planningId: ObjectId;
    fileIds: ObjectId[];
    projectId?: ObjectId;
    path?: string;
    description?: string;
    updatedBy?: ObjectId;
    parentId?: ObjectId;
    calendar: ObjectId;
    workloadAndCapacity: IResourceWorkloadAndCapacity[];
    assignToExistingResourceOption?: AssignToExistingResourceOption;
    sessionToken?: string;
    customObjectIds?: string[];
}

export interface ICreateResourceGroupBody {
    name: string;
    resourceIds: ObjectId[];
    planningId: ObjectId;
    description?: string;
    createdBy?: ObjectId;
}

export interface IUpdateResourceGroupBody {
    name: string;
    resourceIds: ObjectId[];
    planningId: ObjectId;
    projectId?: ObjectId;
    path?: string;
    description?: string;
    updatedBy?: ObjectId;
}

export interface IUpdateTaskBaselineBody {
    name: string;
    taskIds: ObjectId[];
    projectId: ObjectId;
    updatedBy?: ObjectId;
}

export interface IBaselineTask {
    taskId: ObjectId;
    baselineStart: Date;
    baselineFinish: Date;
}

export interface IBaselinePlanningBody {
    name: string;
    planningId: ObjectId;
    projectId?: ObjectId;
    path?: string;
    createdBy?: ObjectId;
    updatedBy?: ObjectId;
}

export interface IBaselinePlanningListQuery extends ICommonListQuery {
    planningId: ObjectId;
}

export interface IBaselineConfiguration {
    display: boolean;
    color: string;
    position: string;
}

export interface IBaselineConfigurationQuery {
    planningId: ObjectId;
}

export interface IBaselineConfigurationBody {
    display: boolean;
    color: string;
    position: string;
    updatedBy?: ObjectId;
    createdBy?: ObjectId;
}

export interface IPlanningFileLocation {
    name: string;
    path: string;
}

export interface ITopDownBody {
    taskIds: ObjectId[];
    linkIds: ObjectId[];
    planningIds: ObjectId[];
    planningId: ObjectId;
    projectId?: ObjectId;
}

export interface IUpdateMilestone {
    start: Date;
    finish: Date;
}

export interface IResourceListQuery extends ICommonListQuery {
    planningId: ObjectId;
    path?: string;
    projectId?: ObjectId;
}

export interface IGetTaskByIdsQueryString {
    taskIds: ObjectId[];
    projectId?: ObjectId;
    path?: string;
}
export interface IResetBaselineBody {
    planningId: ObjectId;
}

export interface IApplyBaselineBody {
    baselineId: ObjectId;
}

export interface IUpdatePlanningDetail {
    appliedBaselineId?: ObjectId;
}

export interface IAppearanceProfileListQuery extends ICommonListQuery {
    planningId: ObjectId;
}

export interface ICreateAppearanceProfileBody {
    name: string;
    type: AppearanceType;
    growthSimulation: GrowthSimulation;
    planningId: ObjectId;
    startAppearanceProfile?: IStartAppearanceProfile;
    activeAppearanceProfile?: IActiveAppearanceProfile;
    endAppearanceProfile?: IEndAppearanceProfile;
    projectId?: ObjectId;
    path?: string;
    createdBy?: ObjectId;
}

export interface IUpdateAppearanceProfileBody {
    name: string;
    type: AppearanceType;
    growthSimulation: GrowthSimulation;
    planningId: ObjectId;
    projectId?: ObjectId;
    path?: string;
    assignFileIds?: string[];
    startAppearanceProfile?: IStartAppearanceProfile;
    activeAppearanceProfile?: IActiveAppearanceProfile;
    endAppearanceProfile?: IEndAppearanceProfile;
    notAssignFileIds?: string[];
    updatedBy?: ObjectId;
}

export interface IFilePathsByFocusTimeQuery {
    sessionToken: string;
    planningId: ObjectId;
    focusTime: string;
    projectId?: ObjectId;
    path?: string;
}

export interface IActivityCodeListQuery {
    projectId: ObjectId;
    path?: string;
}

export interface IProjectGetListQuery extends ICommonListQuery {
    projectId: ObjectId;
    path?: string;
}

export interface IActivityCodeQuery {
    projectId: ObjectId;
}

export interface IActivityCodeValueBody {
    name: string;
    description: string;
    colorCode: string;
    projectId: ObjectId;
    activityCodeId: ObjectId;
    path: string;
    parentId: ObjectId;
    createdBy?: ObjectId;
    createdAt?: Date;
    updatedBy?: ObjectId;
    updatedAt?: Date;
}

export interface IActivityCodeBody {
    name: string;
    maxLength: number;
    projectId: ObjectId;
    createdBy?: ObjectId;
    createdAt?: Date;
    updatedBy?: ObjectId;
    updatedAt?: Date;
}

export interface IAssignActivityCodeValueBody {
    activityCodeValueId: ObjectId | null;
    projectId: ObjectId;
    taskIds: ObjectId[];
}

export interface IAssignActivityCodeValue {
    activityCodeValueId: ObjectId | null;
    taskIds: ObjectId[];
    updatedBy: ObjectId;
}

export interface ICreateAdditionalTaskFieldBody {
    name: string;
    dataType: TaskFieldDataType;
    projectId?: ObjectId;
    path?: string;
}

export interface IUpdateAdditionalTaskFieldBody {
    name: string;
    projectId?: ObjectId;
    path?: string;
}

export interface IProjectSettingField {
    category: boolean;
    description: boolean;
    postalCode: boolean;
    address: boolean;
    coordinates: boolean;
    projectAdmin: boolean;
    time: boolean;
}

export interface IUpdateOrCreateProjectFieldSetting {
    userId: ObjectId;
    projectId: ObjectId;
    settings: IProjectSettingField;
}

export interface ICreateCalendar {
    _id?: ObjectId;
    name: string;
    projectId: ObjectId;
    createdBy?: ObjectId;
    isDefaultCalendar?: boolean;
}
export interface IUpdateCalendar {
    _id?: ObjectId;
    name?: string;
    updatedBy?: ObjectId;
}
export interface ICreateDayType {
    _id?: ObjectId;
    name: string;
    timeBlocks: ITimeBlock[];
    createdBy?: ObjectId;
    projectId: ObjectId;
}
export interface IUpdateDayType {
    _id?: ObjectId;
    name?: string;
    startTime?: string;
    endTime?: string;
    updatedBy?: ObjectId;
}

export interface ICalendarConfig {
    weekDay: number | null;
    month: number | null;
    year: number | null;
    dayTypeId: ObjectId;
    createdBy?: ObjectId;
    updatedBy?: ObjectId;
}

export interface CalendarListQuery extends ICommonListQuery {
    projectId: ObjectId;
}
export interface DayTypeListQuery extends ICommonListQuery {
    projectId: ObjectId;
}

export interface IGetCalendarConfigQuery {
    calendarId: ObjectId;
    startDate?: string;
    endDate?: string;
}

export interface IDayType {
    name: string;
    projectId: ObjectId;
    timeBlocks: ITimeBlock[];
}

export interface IConfigDateBody {
    dayType: DayTypes;
    workingDayTypeId: string;
    date: string;
    repeatType: CalendarConfigRepeatTypes;
    timezone: string;
}

export interface IConfigDateData {
    workingDayTypeId: ObjectId;
    linkKey?: string;
    updatedBy: ObjectId;
    dayType?: DayTypes;
}
export interface IGetCalendarConfigStringQuery {
    startDate: string;
    endDate: string;
}
export interface IExportPlanningQuery {
    projectId: ObjectId;
    name: string;
    planningFilePath: string;
    socketClientId: string;
}

export interface IExportPlanningToPrimaveraP6Body {
    projectId: ObjectId;
    planningId: string;
    planningName: string;
    selectedObjects: ExportObjectList[];
    fileName: string;
    savePath: string;
    timezoneName: string;
    createdBy?: ObjectId;
}

export interface IImportPlanningBody {
    name: string;
    planningFilePath: string;
    projectId: ObjectId;
    originalPlanningId: ObjectId;
    createdBy?: ObjectId;
}

export interface IPlanningByPathNameQuery {
    projectId: ObjectId;
    name: string;
    planningFilePath: string;
    path?: string;
}

export interface IResourceIdQueryString {
    resourceId: ObjectId;
    projectId?: ObjectId;
    path?: string;
}

export interface ICreateProjectNotification {
    projectId: ObjectId;
    createdBy: ObjectId;
    target: string;
    type: ProjectNotificationType;
}
export interface IGetProjectNotification {
    page?: number;
    limit?: number;
    keyword?: string;
    orderBy: OrderBy;
    orderDirection: OrderDirection;
    projectId?: ObjectId;
    type?: ProjectNotificationType;
}

export interface ITaskUpdateByDataDate {
    start: Date;
    actualStart: Date | null;
    plannedStart: Date | null;
    finish: Date;
    actualFinish: Date | null;
    plannedFinish: Date | null;
}
export interface IBulkCreateTaskForMultipleProject {
    projectId: ObjectId;
    taskData: ICreateTaskBody;
}

export interface ITimeBlock {
    startTime: string;
    endTime: string;
}

export interface ICalendarUpdateTask {
    start: Date | string;
    finish: Date | string;
}

export interface ITaskLink {
    source: ObjectId;
    target: ObjectId;
    type: LinkType;
}

export interface IBulkCreateLinksForMultiplePlanning {
    planningId: ObjectId;
    linkData: ITaskLink;
}

export interface IUpdateDelegation {
    tasks: ITaskUpdateDelegation[];
    projectId: string;
    path: string;
    createdBy?: ObjectId;
}

export type IUpdateGeneralMilestone = IUpdateDelegation;

export interface IImportProject {
    name: string;
    dataDate: string;
    p6Id: string;
}

export interface IImportTask {
    p6Id: string;
    name?: string;
    finish?: string;
    start?: string;
    plannedStart?: string;
    plannedFinish?: string;
    actualDuration?: string;
    actualFinish?: string;
    actualStart?: string;
    duration?: string;
    parentId?: string;
    milestoneLinkTo?: MilestoneLinkTo;
    milestoneType?: MilestoneType;
    color?: MilestoneColor;
    taskType?: TaskType;
    primaryConstraints?: string;
}

export interface IImportResource {
    p6Id: string;
    name?: string;
    type?: string;
}

export interface IImportLink {
    source?: string;
    target?: string;
    type?: string;
}

export interface IImportXML {
    project: IImportProject;
    parentTaskId: ObjectId;
    isReplace: boolean;
    tasks?: IImportTask[];
    links?: IImportLink[];
    resources?: IImportResource[];
}
export interface IUpdateOriginalPlanning extends IUpdateDelegation {
    milestones: IMilestoneUpdateOriginalPlanning[];
}
export interface IStartAppearanceProfile {
    colorType: AppearanceOptions;
    colorValue: string;
    transparencyType: AppearanceOptions;
    transparencyValue: number;
}
export interface IEndAppearanceProfile {
    colorType: AppearanceOptions;
    colorValue: string;
    transparencyType: AppearanceOptions;
    transparencyValue: number;
}

export interface IActiveAppearanceProfile {
    colorType: AppearanceOptions;
    colorValue: string;
    transparencyType: AppearanceOptions;
    transparencyStartValue: number;
    transparencyInterpolation: boolean;
    transparencyEndValue: number;
}

export interface ISettingOptionsObject3D {
    status: string;
    customIds: string[];
    color?: string;
    transparency?: string;
}
export interface IRenameTaskBody {
    name: string;
    updatedBy?: ObjectId;
}
