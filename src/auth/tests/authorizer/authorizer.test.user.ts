import { SurveyFactory } from '../../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../authGroup'
import { AuthGroups } from '../../authGroups'
import { UserFactory } from '../../factory'
import { Query } from './common'

import { canInviteUsersQueries } from './user/canInvite'
import { canViewUserQueries } from './user/canViewUser'
import { canEditUserQueries } from './user/canEditUser'
import { canEditUserEmailQueries } from './user/canEditUserEmail'
import { canEditUserGroupQueries } from './user/canEditUserGroup'
import { canRemoveUserQueries } from './user/canRemoveUser'

const queries: Query[] = [
  ...canInviteUsersQueries,
  ...canViewUserQueries,
  ...canEditUserQueries,
  ...canEditUserEmailQueries,
  ...canEditUserGroupQueries,
  ...canRemoveUserQueries,
]

describe('Authorizer - User', () => {
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
})
