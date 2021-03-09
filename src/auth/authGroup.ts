import { Permission } from './permission'

export interface AuthGroup {
  name: string
  surveyUuid?: string
  permissions: Array<Permission>
  recordSteps: { [key: number]: string } // TODO RecordSteps
  uuid: string
}

export const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  surveyGuest: 'surveyGuest',
}

export const permissions = {
  // Surveys
  surveyCreate: 'surveyCreate',

  // Only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit categories, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  // Records
  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',
  recordCleanse: 'recordCleanse',
  recordAnalyse: 'recordAnalyse',

  // Users
  userEdit: 'userEdit',
  userInvite: 'userInvite',

  // Edit
  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

export const DEFAULT_AUTH_GROUPS: Array<AuthGroup> = [
  {
    uuid: 'surveyAdmin',
    name: groupNames.surveyAdmin,
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
    name: groupNames.surveyEditor,
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
    name: groupNames.dataAnalyst,
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
    name: groupNames.dataCleanser,
    permissions: [Permission.recordView, Permission.recordCreate, Permission.recordEdit, Permission.recordCleanse],
    recordSteps: {
      1: 'all',
      2: 'all',
    },
  },
  {
    uuid: 'dataEditor',
    name: groupNames.dataEditor,
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
