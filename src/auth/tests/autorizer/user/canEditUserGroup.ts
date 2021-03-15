import { AuthGroupName } from '../../../authGroup'

import { Authorizer } from '../../../authorizer'
import { Query, ALL_GROUPS, createThirdUser } from '../common'

export const canEditUserGroupQueries: Query[] = [
  // canEditUserGroup
  ...ALL_GROUPS.map((groupName) => ({
    title: `canEditUserGroup: ${groupName} cannot edit an usergroup of itself`,
    groups: [groupName],
    authorizer: Authorizer.canEditUserGroup,
    result: false,
    getParams: ({ user, survey }: any): any[] => [user, survey, user],
  })),

  {
    title: 'canEditUserGroup: systemAdmin can edit user group',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: true,
    getParams: ({ user, survey }: any): any[] => [user, survey, createThirdUser()],
  },

  {
    title: 'canEditUserGroup: surveyAdmin can edit user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUserGroup: surveyAdmin cannot edit user email if user is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: false,
    getParams: ({ user, survey }: any): any[] => [user, survey, createThirdUser()],
  },
]
