import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query } from '../common'

export const canInviteUsersQueries: Query[] = [
  // canInviteUsers
  {
    title: 'canInviteUsers: systemAdmin can',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canInviteUsers,
    result: true,
  },
  {
    title: 'canInviteUsers: surveyAdmin can',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canInviteUsers,
    result: true,
  },
  // users not surveyAdmin cannot invite user
  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canInviteUsers: ${groupName} cannot`,
      groups: [groupName],
      authorizer: Authorizer.canInviteUsers,
      result: false,
    })
  ),
]
