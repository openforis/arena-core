import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query, createThirdUser } from '../common'

export const canViewUserQueries: Query[] = [
  // canViewUser
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
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },
  {
    title: 'canViewUser: surveyAdmin cannot if userToView is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canViewUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, survey, thirdUser]
    },
  },
  // users canViewUser can view other user
  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canViewUser: ${groupName} can view other users into the same survey`,
      groups: [groupName],
      authorizer: Authorizer.canViewUser,
      result: true,
      getParams: ({ user, survey, authGroups }: any): any[] => {
        let thirdUser = createThirdUser()
        thirdUser = { ...thirdUser, authGroups }
        return [user, survey, thirdUser]
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
      getParams: ({ survey, authGroups }: any): any[] => {
        let thirdUser = createThirdUser()
        thirdUser = { ...thirdUser, authGroups }
        return [thirdUser, survey, thirdUser]
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
      getParams: ({ user, survey }: any): any[] => {
        const thirdUser = createThirdUser()
        return [user, survey, thirdUser]
      },
    })
  ),
]
