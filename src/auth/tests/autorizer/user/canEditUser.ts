import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { UserStatus } from '../../../user'
import { Query, ALL_GROUPS, createThirdUser } from './common'

export const canEditUserQueries: Query[] = [
  // canEditUser

  ...ALL_GROUPS.map((groupName) => ({
    title: `canEditUser: ${groupName} cannot edit non ACCEPTED user - FORCE_CHANGE_PASSWORD `,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser({ status: UserStatus.FORCE_CHANGE_PASSWORD })
      return [user, survey, thirdUser]
    },
  })),
  ...ALL_GROUPS.map((groupName) => ({
    title: `canEditUser: ${groupName} cannot edit non ACCEPTED user - INVITED`,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser({ status: UserStatus.INVITED })
      return [user, survey, thirdUser]
    },
  })),
  ...ALL_GROUPS.map((groupName) => ({
    title: `canEditUser: ${groupName} can edit ACCEPTED user if user is the same of userToUpdate`,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [thirdUser, survey, thirdUser]
    },
  })),
  {
    title: 'canEditUser: systemAdmin can edit an ACCEPTED user into the same survey',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },
  {
    title: 'canEditUser: systemAdmin can edit an ACCEPTED user into a different survey',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUser: surveyAdmin can edit an ACCEPTED user into the same survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUser: surveyAdmin cannot edit an ACCEPTED user into a different survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = createThirdUser()
      return [user, survey, thirdUser]
    },
  },

  ...[AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map(
    (groupName) => ({
      title: `canEditUser: ${groupName} can edit ACCEPTED user if user is not the same of userToUpdate`,
      groups: [groupName],
      authorizer: Authorizer.canEditUser,
      result: false,
      getParams: ({ user, survey, authGroups }: any): any[] => {
        let thirdUser = createThirdUser()
        thirdUser = { ...thirdUser, authGroups }
        return [user, survey, thirdUser]
      },
    })
  ),
]
