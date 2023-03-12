export enum ProjectPermissions {
    // ************************************************************************************** GENERAL
    GENERAL_CREATE_CALENDAR = 'GENERAL_CREATE_CALENDAR',
    GENERAL_CREATE_ABS_STRUCTURE = 'GENERAL_CREATE_ABS_STRUCTURE',
    GENERAL_CREATE_PBS_STRUCTURE = 'GENERAL_CREATE_PBS_STRUCTURE',
    GENERAL_CREATE_PROJECT_PROFILE = 'GENERAL_CREATE_PROJECT_PROFILE',
    GENERAL_ADD_USER_FROM_CONSTELLATION = 'GENERAL_ADD_USER_FROM_CONSTELLATION',
    GENERAL_MANAGE_USER_GROUP_OF_PROJECT = 'GENERAL_MANAGE_USER_GROUP_OF_PROJECT',
    GENERAL_UPLOAD_3D_TO_ABS = 'GENERAL_UPLOAD_3D_TO_ABS',
    GENERAL_UPLOAD_PLANNING_TO_ABS = 'GENERAL_UPLOAD_PLANNING_TO_ABS',
    GENERAL_UPLOAD_4D_TO_ABS = 'GENERAL_UPLOAD_4D_TO_ABS',
    GENERAL_ASSIGN_4DBOX_TO_PLANNING = 'GENERAL_ASSIGN_4DBOX_TO_PLANNING',
    GENERAL_ASSIGN_PBS_TO_PLANNING = 'GENERAL_ASSIGN_PBS_TO_PLANNING',
    GENERAL_ASSIGN_PLANNING_TO_4DBOX = 'GENERAL_ASSIGN_PLANNING_TO_4DBOX',
    GENERAL_ASSIGN_4DBOX_TO_PBS = 'GENERAL_ASSIGN_4DBOX_TO_PBS',
    GENERAL_ASSIGN_USER_TO_PBS = 'GENERAL_ASSIGN_USER_TO_PBS',
    GENERAL_REMOVE_USER_FROM_PBS = 'GENERAL_REMOVE_USER_FROM_PBS',
    GENERAL_ASSIGN_PBS_TO_ABS = 'GENERAL_ASSIGN_PBS_TO_ABS',
    GENERAL_RENAME_DATA_IN_ABS = 'GENERAL_RENAME_DATA_IN_ABS',
    GENERAL_DELETE_IN_ABS = 'GENERAL_DELETE_IN_ABS',
    GENERAL_DOWNLOAD_DATA_IN_ABS = 'GENERAL_DOWNLOAD_DATA_IN_ABS',
    GENERAL_IMPORT_CSV = 'GENERAL_IMPORT_CSV',
    GENERAL_LDAP_CONFIGURATION = 'GENERAL_LDAP_CONFIGURATION',
    GENERAL_VIEW_CALENDER = 'GENERAL_VIEW_CALENDER',
    GENERAL_CONFIG_DATE = 'GENERAL_CONFIG_DATE',
    GENERAL_CREATE_DATE_TYPE = 'GENERAL_CREATE_DATE_TYPE',
    GENERAL_CREATE_PLANNING = 'GENERAL_CREATE_PLANNING',
    GENERAL_VIEW_PLANING = 'GENERAL_VIEW_PLANING',
    GENERAL_CREATE_TASK = 'GENERAL_CREATE_TASK',
    // ************************************************************************************** 4D PLANNING
    '4DPLANNING_CREATE_WBS_STRUCTURE' = '4DPLANNING_CREATE_WBS_STRUCTURE',
    '4DPLANNING_CREATE_ACTIVITY_CODE' = '4DPLANNING_CREATE_ACTIVITY_CODE',
    '4DPLANNING_CREATE_RESOURCE' = '4DPLANNING_CREATE_RESOURCE',
    '4DPLANNING_READ_ONLY' = '4DPLANNING_READ_ONLY',
    '4DPLANNING_CREATE_USER_DEFINED' = '4DPLANNING_CREATE_USER_DEFINED',
    '4DPLANNING_CREATE_BASELINE' = '4DPLANNING_CREATE_BASELINE',
    '4DPLANNING_READ_WBS_STRUCTURE' = '4DPLANNING_READ_WBS_STRUCTURE',
    '4DPLANNING_READ_ACTIVITY_CODE' = '4DPLANNING_READ_ACTIVITY_CODE',
    '4DPLANNING_READ_RESOURCE' = '4DPLANNING_READ_RESOURCE',
    '4DPLANNING_READ_USER_DEFINED_FIELD' = '4DPLANNING_READ_USER_DEFINED_FIELD',
    '4DPLANNING_CREATE_APPEARANCE_PROFILE' = '4DPLANNING_CREATE_APPEARANCE_PROFILE',
    '4DPLANNING_CREATE_3D_PATH' = '4DPLANNING_CREATE_3D_PATH',
    '4DPLANNING_CREATE_3D_OBJECT' = '4DPLANNING_CREATE_3D_OBJECT',
    '4DPLANNING_CREATE_TASKS' = '4DPLANNING_CREATE_TASKS',
    '4DPLANNING_CREATE_LINKS' = '4DPLANNING_CREATE_LINKS',
    '4DPLANNING_ASSIGN_RESOURCE_TO_TASK' = '4DPLANNING_ASSIGN_RESOURCE_TO_TASK',
    '4DPLANNING_RESCHEDULING' = '4DPLANNING_RESCHEDULING',
    '4DPLANNING_CREATE_ANIMATION' = '4DPLANNING_CREATE_ANIMATION',
    '4DPLANNING_EXPORT_VIDEO' = '4DPLANNING_EXPORT_VIDEO',
    '4DPLANNING_CREATE_TASK_FROM_3D_OBJECTS' = '4DPLANNING_CREATE_TASK_FROM_3D_OBJECTS',
    // ************************************************************************************** CONSTELLATION

    CONSTELLATION_REALIZE_SYNTHESIS = 'CONSTELLATION_REALIZE_SYNTHESIS',
    CONSTELLATION_BOTTOM_UP_PROCESS = 'CONSTELLATION_BOTTOM_UP_PROCESS',
    CONSTELLATION_TOP_DOWN_PROCESS = 'CONSTELLATION_TOP_DOWN_PROCESS',
    CONSTELLATION_DELEGATE_TASKS = 'CONSTELLATION_DELEGATE_TASKS',
    // ************************************************************************************** 3D WEBVIEWER

    // ********************* START
    // FILE

    '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_OPEN' = '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_OPEN',
    '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_IMPORT' = '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_IMPORT',
    '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_PRINT' = '3D_WEBVIEWER_TABS_START_GROUPS_FILE_FUNCTIONS_PRINT',
    // UNDO

    '3D_WEBVIEWER_TABS_START_GROUPS_UNDO_FUNCTIONS_LAST_ACTIONS' = '3D_WEBVIEWER_TABS_START_GROUPS_UNDO_FUNCTIONS_LAST_ACTIONS',
    // CONTROLS

    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ZOOM_RECTANGLE' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ZOOM_RECTANGLE',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ROTATE' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ROTATE',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_PAN' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_PAN',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_SELECTION_FRAME' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_SELECTION_FRAME',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_TURNTABLE' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_TURNTABLE',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ZOOM' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_ZOOM',
    '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_MOUSE_USE_FREE_ROTATE' = '3D_WEBVIEWER_TABS_START_GROUPS_CONTROLS_FUNCTIONS_MOUSE_USE_FREE_ROTATE',
    // SELECTION_MODE

    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_SELECT' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_SELECT',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_NEIGHBOURHOOD_SEARCH' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_NEIGHBOURHOOD_SEARCH',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_HIDE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_HIDE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_DELETE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_DELETE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_GHOST' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_GHOST',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_COLOR' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_COLOR',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_INSTANCE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_INSTANCE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_PMIREFERENCE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_PMIREFERENCE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_FACE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_FACE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_ATTRIBUTES' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_MODE_FUNCTIONS_ATTRIBUTES',
    // SELECTION

    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_SELECT_ALL' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_SELECT_ALL',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_INVERT_SELECTION' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_INVERT_SELECTION',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_ISOLATE' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_ISOLATE',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_SHOW_SELECTION' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_SHOW_SELECTION',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_HIDE_SELECTION' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_HIDE_SELECTION',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_DELETE_SELECTION' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_DELETE_SELECTION',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_GHOST_SELECTION' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_GHOST_SELECTION',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_UNGHOST' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_UNGHOST',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_DESELECT' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_DESELECT',
    '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_COLOR' = '3D_WEBVIEWER_TABS_START_GROUPS_SELECTION_FUNCTIONS_COLOR',
    // SHOW/HIDE

    '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_SHOW_ALL' = '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_SHOW_ALL',
    '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_UNGHOST_ALL' = '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_UNGHOST_ALL',
    '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_HIDE_ALL_MARKUPS' = '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_HIDE_ALL_MARKUPS',
    '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_HIDE_ALL_PMIS' = '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_HIDE_ALL_PMIS',
    '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_INVERT_VISIBILITY' = '3D_WEBVIEWER_TABS_START_GROUPS_SHOW/HIDE_FUNCTIONS_INVERT_VISIBILITY',
    // ************** END START SECTION
    // ************** DOCUMENT
    // CONTROLS

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_CONTROLS_FUNCTIONS_PAN' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_CONTROLS_FUNCTIONS_PAN',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_CONTROLS_FUNCTIONS_ZOOM_RECTANGLE' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_CONTROLS_FUNCTIONS_ZOOM_RECTANGLE',
    // PAGE

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_PREVIOUS' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_PREVIOUS',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_NEXT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_NEXT',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_PAGE' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_PAGE_FUNCTIONS_PAGE',
    // ROTATE

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_90' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_90',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_180' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_180',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_270' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ROTATE_FUNCTIONS_270',
    // ZOOM

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_ALL' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_ALL',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_WIDTH' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_WIDTH',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_HEIGHT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_FIT_HEIGHT',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_ZOOM_IN' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_ZOOM_IN',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_ZOOM_OUT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_ZOOM_FUNCTIONS_ZOOM_OUT',
    // TEXT

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_TEXT_FUNCTIONS_TEXT_SEARCH' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_TEXT_FUNCTIONS_TEXT_SEARCH',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_TEXT_FUNCTIONS_TEXT_COPY' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_TEXT_FUNCTIONS_TEXT_COPY',
    // GRAPHIC_EFFECTS

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_ILLUSTRATION' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_ILLUSTRATION',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_INVERT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_INVERT',
    // COMPARE

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_COMPARE_FUNCTIONS_COMPARE' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_COMPARE_FUNCTIONS_COMPARE',
    // 3D_MARKUP

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_TEXT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_TEXT',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_CIRCLE' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_CIRCLE',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_RECTANGLE' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_RECTANGLE',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_FREEHAND' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_3D_MARKUP_FUNCTIONS_FREEHAND',
    // SHOW_PANES

    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_SHOW_PANES_FUNCTIONS_LAYER' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_SHOW_PANES_FUNCTIONS_LAYER',
    '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_SHOW_PANES_FUNCTIONS_ATTACHMENTS' = '3D_WEBVIEWER_TABS_DOCUMENT_GROUPS_SHOW_PANES_FUNCTIONS_ATTACHMENTS',
    // ************** VIEW
    // VIEW

    // ALIGNMENT

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_ISOMETRIC' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_ISOMETRIC',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_TOP' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_TOP',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_LEFT' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_LEFT',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_FRONT' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_FRONT',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_BOTTOM' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_BOTTOM',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_RIGHT' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_RIGHT',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_BACK' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_BACK',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_VERTICAL' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ALIGNMENT_FUNCTIONS_VERTICAL',
    // ROTATE

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_90' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_90',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_180' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_180',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_270' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ROTATE_FUNCTIONS_270',
    // ZOOM

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FIT_ALL' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FIT_ALL',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_ZOOM_IN' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_ZOOM_IN',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_ZOOM_OUT' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_ZOOM_OUT',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FOCUS' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FOCUS',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FOCUS_TRANSITION' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_FOCUS_TRANSITION',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_SET_ORIGIN' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ZOOM_FUNCTIONS_SET_ORIGIN',
    // RENDERING_MODE

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_SOLID' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_SOLID',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_WIRES' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_WIRES',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_ILLUSTRATION' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_ILLUSTRATION',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_PERSPECTIVE' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_RENDERING_MODE_FUNCTIONS_PERSPECTIVE',
    // GRAPHIC_EFFECTS

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_SILHOUETTE' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_SILHOUETTE',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_OPAQUE' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_OPAQUE',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_SHADOW' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_GRAPHIC_EFFECTS_FUNCTIONS_SHADOW',
    // FLYTHROUGH
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_FLYTHROUGH_FUNCTIONS_FLYTHROUGH' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_FLYTHROUGH_FUNCTIONS_FLYTHROUGH',
    // SCENES

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SCENES_FUNCTIONS_SHOW_GRID' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SCENES_FUNCTIONS_SHOW_GRID',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SCENES_FUNCTIONS_FULL_SCREEN' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SCENES_FUNCTIONS_FULL_SCREEN',
    // ANIMATION

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_SPIN' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_SPIN',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_ANIMATE' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_ANIMATE',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_CREATE_ANIMATION' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_ANIMATION_FUNCTIONS_CREATE_ANIMATION',
    // SHOW_PANES

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_MODEL_TREE' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_MODEL_TREE',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_VIEWS' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_VIEWS',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_PROPERTIES' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_PROPERTIES',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_SETTINGS' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_SETTINGS',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_SELECTIONS_WND' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_SELECTIONS_WND',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_LAYER' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_LAYER',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_ATTACHMENTS' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_ATTACHMENTS',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_LIGHTING' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_LIGHTING',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_OUTPUT' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_OUTPUT',
    '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_RESET_UI' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_SHOW_PANES_FUNCTIONS_RESET_UI',
    // SHARE

    '3D_WEBVIEWER_TABS_VIEW_GROUPS_MULTISESSIONS_FUNCTIONS_START' = '3D_WEBVIEWER_TABS_VIEW_GROUPS_MULTISESSIONS_FUNCTIONS_START',
    // ************ MEASUREMENT

    // SNAP_MODES

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_FREE' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_FREE',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_END' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_END',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_CENTER' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_SNAP_MODES_FUNCTIONS_SNAP_MODE_CENTER',
    // CIRCLE_MODE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_MODE_FUNCTIONS_ARC' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_MODE_FUNCTIONS_ARC',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_MODE_FUNCTIONS_3_POINTS' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_MODE_FUNCTIONS_3_POINTS',
    // COORDINATE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_COORDINATE_FUNCTIONS_POINT' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_COORDINATE_FUNCTIONS_POINT',
    // LENGTH

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_EDGE' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_EDGE',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_ACCUMULATED_EDGE' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_ACCUMULATED_EDGE',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_POINT_TO_POINT_ON_WIRE' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_LENGTH_FUNCTIONS_POINT_TO_POINT_ON_WIRE',
    // CIRCLE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_FUNCTIONS_RADIUS' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_CIRCLE_FUNCTIONS_RADIUS',
    // DISTANCE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DISTANCE_FUNCTIONS_DISTANCE_BETWEEN_TWO_POINTS' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DISTANCE_FUNCTIONS_DISTANCE_BETWEEN_TWO_POINTS',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DISTANCE_FUNCTIONS_DISTANCE_SOLIDS_TO_SOLIDS' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DISTANCE_FUNCTIONS_DISTANCE_SOLIDS_TO_SOLIDS',
    // ANGLE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_ANGLE_FUNCTIONS_ANGLE_BETWEEN_TWO_AXES' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_ANGLE_FUNCTIONS_ANGLE_BETWEEN_TWO_AXES',
    // FACE

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_FACE_FUNCTIONS_AREA' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_FACE_FUNCTIONS_AREA',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_FACE_FUNCTIONS_ACCUMULATED_AREA' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_FACE_FUNCTIONS_ACCUMULATED_AREA',
    // WALL_THICKNESS

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_WALL_THICKNESS_FUNCTIONS_WALLTHICKNESS_COMPUTATION_MODE_RAY' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_WALL_THICKNESS_FUNCTIONS_WALLTHICKNESS_COMPUTATION_MODE_RAY',
    // BOUNDING_BOX

    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_BOUNDING_BOX_FUNCTIONS_WORLD' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_BOUNDING_BOX_FUNCTIONS_WORLD',
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_BOUNDING_BOX_FUNCTIONS_COMPUTE_MINIMUM' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_BOUNDING_BOX_FUNCTIONS_COMPUTE_MINIMUM',

    // DRILLHOLE
    '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DRILLHOLE_FUNCTIONS_DRILLHOLE' = '3D_WEBVIEWER_TABS_MEASUREMENT_GROUPS_DRILLHOLE_FUNCTIONS_DRILLHOLE',

    // *********** ANALYZE
    // SECTION

    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_SECTION_FUNCTIONS_CUTTING_PLANE_FROM_POINT_NORMAL' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_SECTION_FUNCTIONS_CUTTING_PLANE_FROM_POINT_NORMAL',
    // COMPARE

    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPARE_FUNCTIONS_COMPARE_MODEL' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPARE_FUNCTIONS_COMPARE_MODEL',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPARE_FUNCTIONS_BREP_PART' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPARE_FUNCTIONS_BREP_PART',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_PROJECTED_AREA_FUNCTIONS_PROJECTED_AREA' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_PROJECTED_AREA_FUNCTIONS_PROJECTED_AREA',
    // CLASH

    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_CLASH_FUNCTIONS_CLASH_DETECTION' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_CLASH_FUNCTIONS_CLASH_DETECTION',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_CLASH_FUNCTIONS_BAND_ANALYSIS' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_CLASH_FUNCTIONS_BAND_ANALYSIS',

    // COMPUTE
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPUTE_FUNCTIONS_PHYSICAL_PROPERTIES' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_COMPUTE_FUNCTIONS_PHYSICAL_PROPERTIES',
    // FEATURE_RECOGNITION

    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_FEATURE_RECOGNITION_FUNCTIONS_NEUTRAL_AXIS' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_FEATURE_RECOGNITION_FUNCTIONS_NEUTRAL_AXIS',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_FEATURE_RECOGNITION_FUNCTIONS_DRILLHOLE' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_FEATURE_RECOGNITION_FUNCTIONS_DRILLHOLE',
    // MOLD

    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_DRAFT_ANGLE' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_DRAFT_ANGLE',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_WALL_THICKNESS' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_WALL_THICKNESS',
    '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_SPLIT' = '3D_WEBVIEWER_TABS_ANALYZE_GROUPS_ADVANCED_FUNCTIONS_SPLIT',

    // *********** TRANSFORMATION
    // TRANSFORMATION

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_FREE_DRAG' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_FREE_DRAG',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_MOVE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_MOVE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_ROTATE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_ROTATE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_SCALE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_SCALE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_MIRROR' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_MIRROR',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_EXPLODE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_EXPLODE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_RESET_TRANSFORMATION' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_TRANSFORMATION_FUNCTIONS_RESET_TRANSFORMATION',
    // BOUNDARY_CONDITION

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_BOUNDARY_CONDITION_FUNCTIONS_ACTIVATE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_BOUNDARY_CONDITION_FUNCTIONS_ACTIVATE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_BOUNDARY_CONDITION_FUNCTIONS_BOUNDARY_CONDITION_AXIS' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_BOUNDARY_CONDITION_FUNCTIONS_BOUNDARY_CONDITION_AXIS',
    // ALIGNING_MOVE

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_POINT_TO_POINT' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_POINT_TO_POINT',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_PLANE_TO_PLANE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_PLANE_TO_PLANE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_CIRCLE_CENTER_TO_CIRCLE_CENTER' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_CIRCLE_CENTER_TO_CIRCLE_CENTER',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_CIRCLE_CENTER_TO_POINT' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_FUNCTIONS_CIRCLE_CENTER_TO_POINT',
    // ALIGNING_ROTATE

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_NORMAL_TO_NORMAL' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_NORMAL_TO_NORMAL',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_POINT_TO_POINT' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_POINT_TO_POINT',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_CIRCLE_CENTER_TO_CIRCLE_CENTER' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_ROTATE_FUNCTIONS_CIRCLE_CENTER_TO_CIRCLE_CENTER',
    // ALIGNING_MOVE_ROTATE

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_COORDINATE_SYSTEM_TO_COORDINATE_SYSTEM' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_COORDINATE_SYSTEM_TO_COORDINATE_SYSTEM',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_CIRCLE_AXIS_TO_CIRCLE_AXIS' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_CIRCLE_AXIS_TO_CIRCLE_AXIS',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_PLANE_TO_PLANE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_ALIGNING_MOVE_ROTATE_FUNCTIONS_PLANE_TO_PLANE',
    // MODEL_ALIGNING

    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_SOLID_TO_SOLID' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_SOLID_TO_SOLID',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_LINE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_LINE',
    '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_PLANE' = '3D_WEBVIEWER_TABS_TRANSFORMATION_GROUPS_MODEL_ALIGNING_FUNCTIONS_PLANE',
    // *********** TECH_DOC
    // GENERAL

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_GENERAL_PANEL_FUNCTIONS_BOM' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_GENERAL_PANEL_FUNCTIONS_BOM',
    // ALIGNMENT

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_ALIGNMENT_PANEL_FUNCTIONS_CALLOUTS_ALIGN_TOP' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_ALIGNMENT_PANEL_FUNCTIONS_CALLOUTS_ALIGN_TOP',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_ALIGNMENT_PANEL_FUNCTIONS_CALLOUTS_AUTO_ALIGNMENT' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_ALIGNMENT_PANEL_FUNCTIONS_CALLOUTS_AUTO_ALIGNMENT',
    // CALLOUTS

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CREATE' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CREATE',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_FOR_SELECTION' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_FOR_SELECTION',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_SETTINGS' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_SETTINGS',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SHOW_ALL' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SHOW_ALL',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_LOCK_CALLOUTS' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_LOCK_CALLOUTS',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_UNLOCK_CALLOUTS' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_UNLOCK_CALLOUTS',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SELECT_ASSOCIATED_NODES' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SELECT_ASSOCIATED_NODES',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_MULTIPLE_CONNECTIONS' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_MULTIPLE_CONNECTIONS',
    // CONNECTIONS

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_EDIT' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_EDIT',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_DELETE' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_DELETE',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_INVERT_VISIBILITY' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_CONNECTIONS_PANEL_FUNCTIONS_INVERT_VISIBILITY',
    // VISIBLE_CALLOUTS

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SELECT_VISIBLE' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_SELECT_VISIBLE',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_HIDE_VISIBLE' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_HIDE_VISIBLE',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_DELETE_VISIBLE' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_VISIBLE_CALLOUTS_PANEL_FUNCTIONS_CALLOUTS_DELETE_VISIBLE',
    // 3D-MARKUP

    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_3D_MARKUP_FUNCTIONS_TEXT' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_3D_MARKUP_FUNCTIONS_TEXT',
    '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT' = '3D_WEBVIEWER_TABS_TECH_DOC_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT',

    // *********** MODEL
    // RETESSELATE

    '3D_WEBVIEWER_TABS_MODEL_GROUPS_RETESSELATE_FUNCTIONS_RETESSELATE' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_RETESSELATE_FUNCTIONS_RETESSELATE',
    // COORDINATE_SYSTEM

    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_CYLINDER_AXIS' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_CYLINDER_AXIS',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_CURRENT_GLOBAL' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_CURRENT_GLOBAL',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_SELECTED_PART' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_BY_SELECTED_PART',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_SETTINGS' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_SETTINGS',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_ACTIVATE_COORDINATESYSTEM' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_ACTIVATE_COORDINATESYSTEM',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_RESET_COORDINATESYSTEM' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_COORDINATE_SYSTEM_FUNCTIONS_RESET_COORDINATESYSTEM',
    // CREATE_POINT

    '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_CIRCLE_CENTER' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_CIRCLE_CENTER',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_POINT' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_POINT',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_LINE_TO_LINE' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_POINT_FUNCTIONS_LINE_TO_LINE',
    // CREATE_WIRE

    '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_WIRE_FUNCTIONS_CIRCLE_AXIS' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_WIRE_FUNCTIONS_CIRCLE_AXIS',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_WIRE_FUNCTIONS_POINT_TO_POINT' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_CREATE_WIRE_FUNCTIONS_POINT_TO_POINT',
    // MODIFY_SOLIDS

    '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_EXTRACT_FACES' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_EXTRACT_FACES',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_MERGE_OBJECTS' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_MERGE_OBJECTS',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_MERGE_OBJECTS_HIERARCHICAL' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_MERGE_OBJECTS_HIERARCHICAL',
    '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_CONVEX_HULL' = '3D_WEBVIEWER_TABS_MODEL_GROUPS_MODIFY_SOLIDS_FUNCTIONS_CONVEX_HULL',

    // ************ TOOLS
    // SCREENSHOT

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_SCREENSHOT_FUNCTIONS_CLIPBOARD' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_SCREENSHOT_FUNCTIONS_CLIPBOARD',
    // 3D_MARKUP

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_TEXT' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_TEXT',
    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_CIRCLE' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_CIRCLE',
    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_FIXED_TEXT',
    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_RECTANGLE' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_RECTANGLE',
    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_FREEHAND' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_3D_MARKUP_FUNCTIONS_FREEHAND',

    // SEARCH

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_SEARCH_FUNCTIONS_SEARCH' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_SEARCH_FUNCTIONS_SEARCH',
    // GEOMETRY_TOOLS

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_GEOMETRY_TOOLS_FUNCTIONS_GEOMETRY_TOOLS' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_GEOMETRY_TOOLS_FUNCTIONS_GEOMETRY_TOOLS',
    // IP_PROTECTION

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_IP_PROTECTION_FUNCTIONS_DISTORT' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_IP_PROTECTION_FUNCTIONS_DISTORT',
    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_IP_PROTECTION_FUNCTIONS_VISIBILITY_TEST' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_IP_PROTECTION_FUNCTIONS_VISIBILITY_TEST',
    // EXTRAS

    '3D_WEBVIEWER_TABS_TOOLS_GROUPS_EXTRAS_FUNCTIONS_COMMAND' = '3D_WEBVIEWER_TABS_TOOLS_GROUPS_EXTRAS_FUNCTIONS_COMMAND',
    // // OPEN

    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_OPEN_FUNCTIONS_CUSTOM_OPEN_FILE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_OPEN_FUNCTIONS_CUSTOM_OPEN_FILE',
    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_OPEN_FUNCTIONS_CUSTOM_OPEN_REPOSITORY' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_OPEN_FUNCTIONS_CUSTOM_OPEN_REPOSITORY',
    // //IMPORT

    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_IMPORT_FUNCTIONS_CUSTOM_IMPORT_FILE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_IMPORT_FUNCTIONS_CUSTOM_IMPORT_FILE',
    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_IMPORT_FUNCTIONS_CUSTOM_IMPORT_REPOSITORY' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_IMPORT_FUNCTIONS_CUSTOM_IMPORT_REPOSITORY',
    // // //3D_BROKER

    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_3D_BROKER_FUNCTIONS_CREATE_4D_BOX' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_3D_BROKER_FUNCTIONS_CREATE_4D_BOX',
    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_3D_BROKER_FUNCTIONS_CREATE_ZONE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_3D_BROKER_FUNCTIONS_CREATE_ZONE',
    // //EXPORT_2D

    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_EXPORT_FILE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_EXPORT_FILE',
    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_SAVE_FILE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_SAVE_FILE',
    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_SAVE_AS_FILE' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_EXPORT_FUNCTIONS_SAVE_AS_FILE',
    // Node mode

    '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_NODES_MODE_FUNCTIONS_REMOVE_EMPTY_NODES' = '3D_WEBVIEWER_TABS_CUSTOM_FILE_GROUPS_CUSTOM_NODES_MODE_FUNCTIONS_REMOVE_EMPTY_NODES',
}

export const ProfileOrderby = ['createdAt', 'name'];

export const profileListAttrubutes = [
    '_id',
    'name',
    'description',
    'permissions',
    'createdAt',
    'isDefaultSelect',
    'projectId',
];
