import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { Query, createThirdUser } from '../common'

export const canEditUserEmailQueries: Query[] = [
  // canEditUserEmail

  {
    title: 'canEditUserEmail: systemAdmin can edit user email',
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: true,
    getParams: ({ user, survey }: any): any[] => [user, survey, createThirdUser()],
  },

  {
    title: 'canEditUserEmail: surveyAdmin cannot edit user email if user is into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: false,
    getParams: ({ user, authGroups }: any): any[] => {
      let thirdUser = createThirdUser()
      thirdUser = { ...thirdUser, authGroups }
      return [user, thirdUser]
    },
  },

  {
    title: 'canEditUserEmail: surveyAdmin cannot edit user email if user is not into survey',
    groups: [AuthGroupName.surveyAdmin],
    authorizer: Authorizer.canEditUserEmail,
    result: false,
    getParams: ({ user }: any): any[] => [user, createThirdUser()],
  },
]
