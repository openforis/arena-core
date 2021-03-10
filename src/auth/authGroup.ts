import { Permission } from './permission'

export enum AuthGroupName {
  systemAdmin = 'systemAdmin',
  surveyAdmin = 'surveyAdmin',
  surveyEditor = 'surveyEditor',
  dataEditor = 'dataEditor',
  dataCleanser = 'dataCleanser',
  dataAnalyst = 'dataAnalyst',
  surveyGuest = 'surveyGuest',
}

export interface AuthGroup {
  name: AuthGroupName
  surveyUuid?: string
  permissions: Array<Permission>
  recordSteps: { [key: number]: string }
  uuid: string
}

export const DEFAULT_AUTH_GROUPS: Array<AuthGroup> = [
  {
    uuid: 'surveyAdmin',
    name: AuthGroupName.surveyAdmin,
    permissions: [
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
    recordSteps: {
      1: 'all',
      2: 'all',
      3: 'all',
    },
  },
  {
    uuid: 'surveyEditor',
    name: AuthGroupName.surveyEditor,
    permissions: [
      Permission.surveyEdit,
      Permission.recordView,
      Permission.recordCreate,
      Permission.recordEdit,
      Permission.recordCleanse,
      Permission.recordAnalyse,
    ],
    recordSteps: {
      1: 'all',
      2: 'all',
      3: 'all',
    },
  },
  {
    uuid: 'dataAnalyst',
    name: AuthGroupName.dataAnalyst,
    permissions: [
      Permission.recordView,
      Permission.recordCreate,
      Permission.recordEdit,
      Permission.recordCleanse,
      Permission.recordAnalyse,
    ],
    recordSteps: {
      1: 'all',
      2: 'all',
      3: 'all',
    },
  },
  {
    uuid: 'dataCleanser',
    name: AuthGroupName.dataCleanser,
    permissions: [Permission.recordView, Permission.recordCreate, Permission.recordEdit, Permission.recordCleanse],
    recordSteps: {
      1: 'all',
      2: 'all',
    },
  },
  {
    uuid: 'dataEditor',
    name: AuthGroupName.dataEditor,
    permissions: [Permission.recordView, Permission.recordCreate, Permission.recordEdit],
    recordSteps: {
      1: 'own',
    },
  },
  // ,
  // {
  //   name: groupNames.surveyGuest,
  //   labels: {[lang]: 'Survey guest'},
  //   descriptions: {[lang]: `Can view records`},
  // },
]
