import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query, createThirdUser } from '../common'

export const canViewUserQueries: Query[] = [
  // systemAdmin
  {
    title: 'canViewUser: systemAdmin can',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canViewUser,
    result: true,
  },
  {
    title: 'canViewUser: surveyAdmin can if userToView is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canViewUser,
    result: true,
    getParams: ({ user, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, undefined, thirdUser]
    },
  },
  {
    title: 'canViewUser: surveyAdmin cannot if userToView is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canViewUser,
    result: false,
    getParams: ({ user }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, undefined, thirdUser]
    },
  },
  // users canViewUser can view other user
  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canViewUser: ${groupName} can view other users into the same survey`,
      groups: [groupName],
      authorizer: Authorizer.canViewUser,
      result: true,
      getParams: ({ user, authGroups }: any): any[] => {
        let thirdUser = createThirdUser()
        thirdUser = { ...thirdUser, authGroups }
        return [user, undefined, thirdUser]
      },
    })
  ),
  // users canViewUser can view other user in the same survey
  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canViewUser: ${groupName} can view itself into the smae survey`,
      groups: [groupName],
      authorizer: Authorizer.canViewUser,
      result: true,
      getParams: ({ authGroups }: any): any[] => {
        let thirdUser = createThirdUser()
        thirdUser = { ...thirdUser, authGroups }
        return [thirdUser, undefined, thirdUser]
      },
    })
  ),
  // users not canViewUser cannot view other surveys users
  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canViewUser: ${groupName} cannot view users in other surveys`,
      groups: [groupName],
      authorizer: Authorizer.canViewUser,
      result: false,
      getParams: ({ user }: any): any[] => [user, undefined, createThirdUser()],
    })
  ),
]
