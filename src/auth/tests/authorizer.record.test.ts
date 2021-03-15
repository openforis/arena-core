import { Authorizer } from '../authorizer'
import { UserFactory } from '../factory'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../authGroup'
import { SurveyFactory } from '../../survey'
import { AuthGroups } from '../authGroups'

/* 
Contains tests for Authorizer:
For permissions, check: src/auth/authGroup.ts

  Record
  CREATE
  - canCreateRecord

  READ
  - canViewRecord

  UPDATE
  - canEditRecord
  - canCleanseRecords
  - canAnalyzeRecords

*/

type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
}

const queries: Query[] = [
  // canCreateRecord
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canCreateRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canCreateRecord,
    result: true,
  })),
  // canViewRecord
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canViewRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canViewRecord,
    result: true,
  })),
  // canEditRecord
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    result: true,
  })),
  // canCleanseRecords
  // truthy
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
  ].map((groupName) => ({
    title: `canCleanseRecords: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canCleanseRecords,
    result: true,
  })),
  // falsy
  {
    title: `canCleanseRecords: ${AuthGroupName.dataEditor} cannot`,
    groups: [AuthGroupName.dataEditor],
    authorizer: Authorizer.canCleanseRecords,
    result: false,
  },
  // canAnalyzeRecords
  // truthy
  ...[AuthGroupName.systemAdmin, AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst].map(
    (groupName) => ({
      title: `canAnalyzeRecords: ${groupName} can`,
      groups: [groupName],
      authorizer: Authorizer.canAnalyzeRecords,
      result: true,
    })
  ),
  // falsy
  ...[AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map((groupName) => ({
    title: `canAnalyzeRecords: ${groupName} cannot`,
    groups: [groupName],
    authorizer: Authorizer.canAnalyzeRecords,
    result: false,
  })),
]

describe('Authorizer - Record', () => {
  const ownerUser = UserFactory.createInstance({ email: 'owner@arena.org', name: 'survey owner' })
  const defaultUser = UserFactory.createInstance({ email: 'user@arena.org', name: 'user' })
  const survey = SurveyFactory.createInstance({ name: 'test_authorizer', ownerUuid: ownerUser.uuid })
  survey.authGroups = AuthGroups.getDefaultGroups(survey.uuid)

  queries.forEach((query) => {
    const { title, groups, authorizer, result: resultExpected } = query

    const authGroups: AuthGroup[] =
      groups.length === 1 && groups[0] === AuthGroupName.systemAdmin
        ? [SYSTEM_ADMIN_GROUP]
        : survey.authGroups.filter((group) => groups.includes(group.name))

    const user = { ...defaultUser, authGroups }

    test(title, () => {
      const result = authorizer(user, survey)
      expect(result).toBe(resultExpected)
    })
  })
})
