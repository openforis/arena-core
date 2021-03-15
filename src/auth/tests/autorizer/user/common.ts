import { AuthGroupName } from '../../../authGroup'

import { UserFactory } from '../../../factory'
import { UserStatus } from '../../../user'

export type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
  getParams?: any
}

export const ALL_GROUPS = [
  AuthGroupName.systemAdmin,
  AuthGroupName.surveyAdmin,
  AuthGroupName.surveyEditor,
  AuthGroupName.dataAnalyst,
  AuthGroupName.dataCleanser,
  AuthGroupName.dataEditor,
]

export const createThirdUser = ({ status = UserStatus.ACCEPTED } = {}) =>
  UserFactory.createInstance({
    email: 'third@arena.org',
    name: 'third',
    status,
  })
