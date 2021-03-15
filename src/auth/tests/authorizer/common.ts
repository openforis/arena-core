import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../authGroup'
import { SurveyFactory } from '../../../survey'
import { AuthGroups } from '../../authGroups'
import { UserFactory } from '../../factory'
import { UserStatus } from '../../user'

export type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
  getParams?: any
}

export const ALL_GROUPS = [
  AuthGroupName.systemAdmin,
  AuthGroupName.surveyAdmin,
  AuthGroupName.surveyEditor,
  AuthGroupName.dataAnalyst,
  AuthGroupName.dataCleanser,
  AuthGroupName.dataEditor,
]

export const createThirdUser = ({ status = UserStatus.ACCEPTED } = {}) =>
  UserFactory.createInstance({
    email: 'third@arena.org',
    name: 'third',
    status,
  })

export const testQueries = (queries: Query[]) => () => {
  const ownerUser = UserFactory.createInstance({ email: 'owner@arena.org', name: 'survey owner' })
  const defaultUser = UserFactory.createInstance({ email: 'user@arena.org', name: 'user' })
  const survey = SurveyFactory.createInstance({ name: 'test_authorizer', ownerUuid: ownerUser.uuid })
  survey.authGroups = AuthGroups.getDefaultGroups(survey.uuid)

  queries.forEach((query) => {
    const { title, groups, authorizer, result: resultExpected, getParams = false } = query

    const authGroups: AuthGroup[] =
      groups.length === 1 && groups[0] === AuthGroupName.systemAdmin
        ? [SYSTEM_ADMIN_GROUP]
        : survey.authGroups.filter((group) => groups.includes(group.name))

    const user = { ...defaultUser, authGroups }

    test(title, () => {
      const params = getParams ? getParams({ user, survey, authGroups }) : [user, survey]
      const result = authorizer(...params)
      expect(result).toBe(resultExpected)
    })
  })
}
