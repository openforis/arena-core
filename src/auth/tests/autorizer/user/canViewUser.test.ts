import { SurveyFactory } from '../../../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../../authGroup'
import { AuthGroups } from '../../../authGroups'
import { Authorizer } from '../../../authorizer'
import { UserFactory } from '../../../factory'

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
