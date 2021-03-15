import { AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query, ALL_GROUPS, createThirdUser } from '../common'

export const canRemoveUserQueries: Query[] = [
  // canRemoveUser
  ...ALL_GROUPS.map((groupName) => ({
    title: `canRemoveUser: ${groupName} cannot remove itself`,
    groups: [groupName],
    authorizer: Authorizer.canRemoveUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      return [user, survey, user]
    },
  })),
  ...ALL_GROUPS.map((groupName) => ({
    title: `canRemoveUser: ${groupName} cannot remove user if user is System Admin`,
    groups: [groupName],
    authorizer: Authorizer.canRemoveUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups: [SYSTEM_ADMIN_GROUP] }
      return [user, survey, thirdUser]
    },
  })),
  {
    title: 'canRemoveUser: systemAdmin can remove user',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canRemoveUser,
    result: true,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canRemoveUser: surveyAdmin can remove user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canRemoveUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canRemoveUser: surveyAdmin cannot remove user if user is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canRemoveUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, survey, thirdUser]
    },
  },
]
