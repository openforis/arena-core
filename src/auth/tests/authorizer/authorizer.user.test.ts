import { describe } from '@jest/globals'

import { testQueries } from './common'
import { canEditUserQueries } from './user/canEditUser'
import { canEditUserEmailQueries } from './user/canEditUserEmail'
import { canEditUserGroupQueries } from './user/canEditUserGroup'
import { canInviteUsersQueries } from './user/canInvite'
import { canRemoveUserQueries } from './user/canRemoveUser'
import { canViewUserQueries } from './user/canViewUser'

describe(
  'Authorizer - User',
  testQueries([
    ...canInviteUsersQueries,
    ...canViewUserQueries,
    ...canEditUserQueries,
    ...canEditUserEmailQueries,
    ...canEditUserGroupQueries,
    ...canRemoveUserQueries,
  ])
)
