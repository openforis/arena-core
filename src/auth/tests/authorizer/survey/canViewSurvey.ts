import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query } from '../common'

export const canViewSurveyQueries: Query[] = [
  // canViewSurvey
  // every user with auth group can view survey
  ...Object.values(AuthGroupName)
    .filter((groupName) => groupName !== AuthGroupName.surveyManager)
    .map((groupName) => ({
      title: `canViewSurvey: ${groupName} can`,
      groups: [groupName],
      authorizer: Authorizer.canViewSurvey,
      result: true,
    })),
  {
    title: 'canViewSurvey: user without survey authGroup cannot',
    groups: [],
    authorizer: Authorizer.canViewSurvey,
    result: false,
  },
]
