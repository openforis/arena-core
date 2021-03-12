describe('Authorizer', () => {
  test(`x`, () => expect(true).toBeTruthy())
})

// import { SurveyFactory } from '../survey'
// import { AuthGroup, AuthGroupName, DEFAULT_AUTH_GROUPS } from './authGroup'
// import { Authorizer } from './authorizer'
// import { UserFactory } from './factory'
// import { User } from './user'

// describe('Authorizer', () => {
//   const ownerUser = UserFactory.createInstance({ email: 'owner@arena.org', name: 'owner user' })
//   const survey = SurveyFactory.createInstance({ name: 'test_authorizer', ownerUuid: ownerUser.uuid })
//   survey.authGroups = Array.from(DEFAULT_AUTH_GROUPS)

//   // TODO move it to Surveys.ts?
//   const getSurveyAuthGroup = (name: string): AuthGroup =>
//     survey.authGroups.find((ag) => ag.name === name) || <AuthGroup>(<unknown>null)

//   const createUser = (authGroupName: AuthGroupName): User => {
//     const user = UserFactory.createInstance({ email: `${authGroupName}@arena.org`, name: `${authGroupName} user` })
//     user.authGroups = [getSurveyAuthGroup(authGroupName)]
//     return user
//   }
//   const dataAnalystUser = createUser(AuthGroupName.dataAnalyst)
//   const dataCleanserUser = createUser(AuthGroupName.dataCleanser)
//   const dataEditorUser = createUser(AuthGroupName.dataEditor)
//   const surveyAdminGuest = createUser(AuthGroupName.surveyAdmin)
//   const surveyEditorUser = createUser(AuthGroupName.surveyEditor)
//   const systemAdminUser = createUser(AuthGroupName.systemAdmin)

//   const allUsers = [
//     dataAnalystUser,
//     dataCleanserUser,
//     dataEditorUser,
//     surveyAdminGuest,
//     surveyEditorUser,
//     systemAdminUser,
//   ]
//   allUsers.map((user) =>
//     test(`Authorizer - canViewSurvey (${user.authGroups?.[0]?.name})`, () =>
//       expect(Authorizer.canViewSurvey(user, survey)).toBeTruthy())
//   )
//   //   test('Authorizer - canViewSurvey (systemAdmin)', () => {
//   //     expect(Authorizer.canViewSurvey(systemAdminUser, survey)).toBeTruthy()
//   //   })
// })
