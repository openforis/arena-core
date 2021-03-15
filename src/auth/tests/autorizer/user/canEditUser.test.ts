import { SurveyFactory } from '../../../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../../authGroup'
import { AuthGroups } from '../../../authGroups'
import { Authorizer } from '../../../authorizer'
import { UserFactory } from '../../../factory'
import { UserStatus } from '../../../user'

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

const ALL_GROUPS = [
  AuthGroupName.systemAdmin,
  AuthGroupName.surveyAdmin,
  AuthGroupName.surveyEditor,
  AuthGroupName.dataAnalyst,
  AuthGroupName.dataCleanser,
  AuthGroupName.dataEditor,
]
const queries: Query[] = [
  // canEditUser

  ...ALL_GROUPS.map((groupName) => ({
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
  ...ALL_GROUPS.map((groupName) => ({
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
  ...ALL_GROUPS.map((groupName) => ({
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
