import { SurveyFactory } from '../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../authGroup'
import { AuthGroups } from '../authGroups'
import { Authorizer } from '../authorizer'
import { UserFactory } from '../factory'

type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
}

const queries: Query[] = [
  // canViewSurvey
  // every user with auth group can view survey
  ...Object.values(AuthGroupName).map((groupName) => ({
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
  // canEditSurvey
  {
    title: 'canViewSurvey: surveyAdmin can',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditSurvey,
    result: true,
  },
  {
    title: 'canViewSurvey: surveyEditor can',
    groups: [AuthGroupName.surveyEditor],
    authorizer: Authorizer.canEditSurvey,
    result: true,
  },
]

describe('Authorizer - Survey', () => {
  const ownerUser = UserFactory.createInstance({ email: 'owner@arena.org', name: 'survey owner' })
  const defaultUser = UserFactory.createInstance({ email: 'user@arena.org', name: 'user' })
  const survey = SurveyFactory.createInstance({ name: 'test_authorizer', ownerUuid: ownerUser.uuid })
  survey.authGroups = AuthGroups.getDefaultGroups(survey.uuid)

  queries.forEach((query) => {
    const { title, groups, authorizer, result: resultExpected } = query

    const authGroups: AuthGroup[] =
      groups.length === 1 && groups[0] === AuthGroupName.systemAdmin
        ? [SYSTEM_ADMIN_GROUP]
        : survey.authGroups.filter((group) => groups.includes(group.name))

    const user = { ...defaultUser, authGroups }

    test(title, () => {
      const result = authorizer(user, survey)
      expect(result).toBe(resultExpected)
    })
  })
})
