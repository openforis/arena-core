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
