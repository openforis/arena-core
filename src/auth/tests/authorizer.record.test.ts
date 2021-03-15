import { UserFactory } from '../factory'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../authGroup'
import { SurveyFactory } from '../../survey'
import { AuthGroups } from '../authGroups'
import { canAnalyzeRecordQueries } from './autorizer/record/canAnalyzeRecord'
import { canCleanseRecordQueries } from './autorizer/record/canCleanseRecord'
import { canCreateRecordQueries } from './autorizer/record/canCreateRecord'
import { canEditRecordQueries } from './autorizer/record/canEditRecord'
import { canViewRecordQueries } from './autorizer/record/canViewRecord'
import { Query } from './autorizer/user/common'

/* 
Contains tests for Authorizer:
For permissions, check: src/auth/authGroup.ts

  Record
  CREATE
  - canCreateRecord

  READ
  - canViewRecord

  UPDATE
  - canEditRecord
  - canCleanseRecords
  - canAnalyzeRecords

*/

const queries: Query[] = [
  ...canCreateRecordQueries,
  ...canEditRecordQueries,
  ...canCleanseRecordQueries,
  ...canViewRecordQueries,
  ...canAnalyzeRecordQueries,
]

describe('Authorizer - Record', () => {
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
