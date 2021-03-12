import { SurveyFactory } from '../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../authGroup'
import { AuthGroups } from '../authGroups'
import { Authorizer } from '../authorizer'
import { UserFactory } from '../factory'
import { UserStatus } from '../user'

/*
 //Users
  // EDIT
  canEditUser,
  canEditUserEmail,
  canEditUserGroup,
  canRemoveUser,

*/

type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
  getParams?: any
}

const queries: Query[] = [
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
      let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
        let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
        let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
        const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
        return [user, survey, thirdUser]
      },
    })
  ),

  // canEditUser

  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditUser: ${groupName} cannot edit non ACCEPTED user - FORCE_CHANGE_PASSWORD `,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.FORCE_CHANGE_PASSWORD,
      })
      return [user, survey, thirdUser]
    },
  })),
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditUser: ${groupName} cannot edit non ACCEPTED user - INVITED`,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.INVITED,
      })
      return [user, survey, thirdUser]
    },
  })),
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditUser: ${groupName} can edit ACCEPTED user if user is the same of userToUpdate`,
    groups: [groupName],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.ACCEPTED,
      })
      return [thirdUser, survey, thirdUser]
    },
  })),
  {
    title: 'canEditUser: systemAdmin can edit an ACCEPTED user into the same survey',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.ACCEPTED,
      })
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
      const thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.ACCEPTED,
      })
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUser: surveyAdmin can edit an ACCEPTED user into the same survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.ACCEPTED,
      })
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
      const thirdUser = UserFactory.createInstance({
        email: 'third@arena.org',
        name: 'third',
        status: UserStatus.ACCEPTED,
      })
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
        let thirdUser = UserFactory.createInstance({
          email: 'third@arena.org',
          name: 'third',
          status: UserStatus.ACCEPTED,
        })
        thirdUser = { ...thirdUser, authGroups }
        return [user, survey, thirdUser]
      },
    })
  ),

  // canEditUserEmail

  {
    title: 'canEditUserEmail: systemAdmin can edit user email',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: true,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUserEmail: surveyAdmin can edit user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUserEmail: surveyAdmin cannot edit user email if user is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },

  // canEditUserGroup
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditUserGroup: ${groupName} cannot edit an usergroup of itself`,
    groups: [groupName],
    authorizer: Authorizer.canEditUserGroup,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      return [user, survey, user]
    },
  })),

  {
    title: 'canEditUserGroup: systemAdmin can edit user group',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: true,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUserGroup: surveyAdmin can edit user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      thirdUser = { ...thirdUser, authGroups }
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canEditUserGroup: surveyAdmin cannot edit user email if user is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserGroup,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },

  // canRemoveUser
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canRemoveUser: ${groupName} cannot remove itself`,
    groups: [groupName],
    authorizer: Authorizer.canRemoveUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      return [user, survey, user]
    },
  })),
  // canRemoveUser
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canRemoveUser: ${groupName} cannot remove user if user is System Admin`,
    groups: [groupName],
    authorizer: Authorizer.canRemoveUser,
    result: false,
    getParams: ({ user, survey }: any): any[] => {
      let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },

  {
    title: 'canRemoveUser: surveyAdmin can remove user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canRemoveUser,
    result: true,
    getParams: ({ user, survey, authGroups }: any): any[] => {
      let thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
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
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third' })
      return [user, survey, thirdUser]
    },
  },
]

describe('Authorizer - User', () => {
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
