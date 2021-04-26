import { testQueries } from './common'
import { canInviteUsersQueries } from './user/canInvite'
import { canViewUserQueries } from './user/canViewUser'
import { canEditUserQueries } from './user/canEditUser'
import { canEditUserEmailQueries } from './user/canEditUserEmail'
import { canEditUserGroupQueries } from './user/canEditUserGroup'
import { canRemoveUserQueries } from './user/canRemoveUser'

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
