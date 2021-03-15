import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query } from '../common'

export const canEditSurveyQueries: Query[] = [
  // canEditSurvey
  {
    title: 'canEditSurvey: systemAdmin can',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditSurvey,
    result: true,
  },
  {
    title: 'canEditSurvey: surveyAdmin can',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditSurvey,
    result: true,
  },
  {
    title: 'canEditSurvey: surveyEditor can',
    groups: [AuthGroupName.surveyEditor],
    authorizer: Authorizer.canEditSurvey,
    result: true,
  },
  // users not surveyAdmin or surveyEditor cannot edit survey
  ...[AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map((groupName) => ({
    title: `canEditSurvey: ${groupName} cannot`,
    groups: [groupName],
    authorizer: Authorizer.canEditSurvey,
    result: false,
  })),
]
