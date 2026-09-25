import { describe, expect, test } from '@jest/globals'

import { createQueryTestCases } from './common'
import { canEditUserQueries } from './user/canEditUser'
import { canEditUserEmailQueries } from './user/canEditUserEmail'
import { canEditUserGroupQueries } from './user/canEditUserGroup'
import { canInviteUsersQueries } from './user/canInvite'
import { canRemoveUserQueries } from './user/canRemoveUser'
import { canViewUserQueries } from './user/canViewUser'

const testCases = createQueryTestCases([
  ...canInviteUsersQueries,
  ...canViewUserQueries,
  ...canEditUserQueries,
  ...canEditUserEmailQueries,
  ...canEditUserGroupQueries,
  ...canRemoveUserQueries,
])

describe('Authorizer - User', () => {
  test.each(testCases)('$title', ({ authorizer, params, resultExpected }) => {
    expect(authorizer(...params)).toBe(resultExpected)
  })
})
