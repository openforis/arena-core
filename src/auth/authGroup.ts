import { Permission, RecordStepPermission } from './permission'

export enum AuthGroupName {
  systemAdmin = 'systemAdmin',
  surveyAdmin = 'surveyAdmin',
  surveyEditor = 'surveyEditor',
  surveyManager = 'surveyManager',
  surveyGuest = 'surveyGuest',
  dataEditor = 'dataEditor',
  dataCleanser = 'dataCleanser',
  dataAnalyst = 'dataAnalyst',
}

export interface AuthGroup {
  name: AuthGroupName
  surveyUuid?: string
  permissions?: Array<Permission>
  recordSteps?: { [key: number]: RecordStepPermission }
  uuid?: string
}

export const sortedGroupNames = [
  AuthGroupName.systemAdmin,
  AuthGroupName.surveyManager,
  AuthGroupName.surveyAdmin,
  AuthGroupName.surveyEditor,
  AuthGroupName.dataAnalyst,
  AuthGroupName.dataCleanser,
  AuthGroupName.dataEditor,
  AuthGroupName.surveyGuest,
]

export const surveyGroupNames = [
  AuthGroupName.surveyAdmin,
  AuthGroupName.surveyEditor,
  AuthGroupName.dataEditor,
  AuthGroupName.dataCleanser,
  AuthGroupName.dataAnalyst,
  AuthGroupName.surveyGuest,
]

export const SYSTEM_ADMIN_GROUP: AuthGroup = { name: AuthGroupName.systemAdmin }

export const permissionsByGroupName: { [key in AuthGroupName]: Permission[] } = {
  [AuthGroupName.systemAdmin]: Object.values(Permission),
  [AuthGroupName.surveyManager]: [
    Permission.permissionsEdit,
    Permission.surveyCreate,
    Permission.surveyEdit,
    Permission.recordView,
    Permission.recordCreate,
    Permission.recordEdit,
    Permission.recordCleanse,
    Permission.recordAnalyse,
    Permission.userEdit,
    Permission.userInvite,
  ],
  [AuthGroupName.surveyAdmin]: [
    Permission.permissionsEdit,
    Permission.surveyEdit,
    Permission.recordView,
    Permission.recordCreate,
    Permission.recordEdit,
    Permission.recordCleanse,
    Permission.recordAnalyse,
    Permission.userEdit,
    Permission.userInvite,
  ],
  [AuthGroupName.surveyEditor]: [
    Permission.surveyEdit,
    Permission.recordView,
    Permission.recordCreate,
    Permission.recordEdit,
    Permission.recordCleanse,
    Permission.recordAnalyse,
  ],
  [AuthGroupName.dataAnalyst]: [
    Permission.recordView,
    Permission.recordCreate,
    Permission.recordEdit,
    Permission.recordCleanse,
    Permission.recordAnalyse,
  ],
  [AuthGroupName.dataCleanser]: [
    Permission.recordView,
    Permission.recordCreate,
    Permission.recordEdit,
    Permission.recordCleanse,
  ],
  [AuthGroupName.dataEditor]: [Permission.recordView, Permission.recordCreate, Permission.recordEdit],
  [AuthGroupName.surveyGuest]: [Permission.recordView],
}

export const DEFAULT_AUTH_GROUPS: Array<AuthGroup> = [
  {
    name: AuthGroupName.surveyAdmin,
    permissions: permissionsByGroupName[AuthGroupName.surveyAdmin],
    recordSteps: {
      1: RecordStepPermission.all,
      2: RecordStepPermission.all,
      3: RecordStepPermission.all,
    },
  },
  {
    name: AuthGroupName.surveyEditor,
    permissions: permissionsByGroupName[AuthGroupName.surveyEditor],
    recordSteps: {
      1: RecordStepPermission.all,
      2: RecordStepPermission.all,
      3: RecordStepPermission.all,
    },
  },
  {
    name: AuthGroupName.dataAnalyst,
    permissions: permissionsByGroupName[AuthGroupName.dataAnalyst],
    recordSteps: {
      1: RecordStepPermission.all,
      2: RecordStepPermission.all,
      3: RecordStepPermission.all,
    },
  },
  {
    name: AuthGroupName.dataCleanser,
    permissions: permissionsByGroupName[AuthGroupName.dataCleanser],
    recordSteps: {
      1: RecordStepPermission.all,
      2: RecordStepPermission.all,
    },
  },
  {
    name: AuthGroupName.dataEditor,
    permissions: permissionsByGroupName[AuthGroupName.dataEditor],
    recordSteps: {
      1: RecordStepPermission.own,
    },
  },
  {
    name: AuthGroupName.surveyGuest,
    permissions: permissionsByGroupName[AuthGroupName.surveyGuest],
    recordSteps: {
      3: RecordStepPermission.all,
    },
  },
]
