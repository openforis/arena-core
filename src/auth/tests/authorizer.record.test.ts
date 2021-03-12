import { Authorizer } from '../authorizer'
import { UserFactory } from '../factory'
import { AuthGroup, AuthGroupName, DEFAULT_AUTH_GROUPS } from '../authGroup'
import { User } from 'src/auth'
import { SurveyFactory } from '../../survey'

describe('Authorizer', () => {
  const ownerUser = UserFactory.createInstance({ email: 'owner@arena.org', name: 'owner user' })
  const survey = SurveyFactory.createInstance({ name: 'test_authorizer', ownerUuid: ownerUser.uuid })
  survey.authGroups = Array.from(DEFAULT_AUTH_GROUPS)

  // TODO move it to Surveys.ts?
  const getSurveyAuthGroup = (name: string): AuthGroup =>
    survey.authGroups.find((ag) => ag.name === name) || <AuthGroup>(<unknown>null)

  const createUser = (authGroupName: AuthGroupName): User => {
    const user = UserFactory.createInstance({ email: `${authGroupName}@arena.org`, name: `${authGroupName} user` })
    user.authGroups = [getSurveyAuthGroup(authGroupName)]
    return user
  }
  const dataAnalystUser = createUser(AuthGroupName.dataAnalyst)
  const dataCleanserUser = createUser(AuthGroupName.dataCleanser)
  const dataEditorUser = createUser(AuthGroupName.dataEditor)
  const surveyAdminGuest = createUser(AuthGroupName.surveyAdmin)
  const surveyEditorUser = createUser(AuthGroupName.surveyEditor)
  const systemAdminUser = createUser(AuthGroupName.systemAdmin)

  const usersCanEditRecord = [systemAdminUser]

  const usersCannotEditRecord = [dataAnalystUser, dataCleanserUser, dataEditorUser, surveyAdminGuest, surveyEditorUser]

  usersCanEditRecord.map((user) =>
    test(`Authorizer - canCreateRecord (${user.authGroups?.[0]?.name})`, () =>
      expect(Authorizer.canCreateRecord(user, survey)).toBeTruthy())
  )

  usersCannotEditRecord.map((user) =>
    test(`Authorizer - canCreateRecord (${user.authGroups?.[0]?.name})`, () =>
      expect(Authorizer.canCreateRecord(user, survey)).toBeFalsy())
  )
})

//  //Record
//   // CREATE
//   canCreateRecord,
//   // READ
//   canViewRecord,
//   // UPDATE
//   canEditRecord,
//   canCleanseRecords,
//   canAnalyzeRecords,
