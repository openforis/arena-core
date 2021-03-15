import { Authorizer } from '../authorizer'
import { UserFactory } from '../factory'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../authGroup'
import { SurveyFactory } from '../../survey'
import { AuthGroups } from '../authGroups'
import { RecordFactory } from '../../record'

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

export type Query = {
  title: string
  groups: AuthGroupName[]
  authorizer: any
  result: boolean
  getParams?: any
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
  // system admin can
  {
    title: `canEditRecord: systemAdmin can`,
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid })
      return [user, record]
    },
    result: true,
  },
  // canEditRecord
  // user is the owner of the record
  ...[
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canEditRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid })
      return [user, record]
    },
    result: true,
  })),
  // canEditRecord
  // record cannot be edited if auth group is dataEditor and record is not owned by the user
  {
    title: `canEditRecord (not owned record): dataEditor cannot`,
    groups: [AuthGroupName.dataEditor],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third user' })
      const record = RecordFactory.createInstance({ user: thirdUser, surveyId: survey.id, surveyUuid: survey.uuid })
      return [user, record]
    },
    result: false,
  },
  // canEditRecord
  // record in step 2 can be edited by all groups but dataEditor
  ...[AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser].map(
    (groupName) => ({
      title: `canEditRecord step 2: ${groupName} can`,
      groups: [groupName],
      authorizer: Authorizer.canEditRecord,
      getParams: ({ user, survey }: any): any[] => {
        const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid, step: '2' })
        return [user, record]
      },
      result: true,
    })
  ),
  // record in step 2 cannot be edited by dataEditor
  ...[AuthGroupName.dataEditor].map((groupName) => ({
    title: `canEditRecord step 2: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid, step: '2' })
      return [user, record]
    },
    result: false,
  })),
  // canEditRecord
  // record in step 3 can be edited by all groups but dataEditor
  ...[AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst].map((groupName) => ({
    title: `canEditRecord step 3: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid, step: '3' })
      return [user, record]
    },
    result: true,
  })),
  // record in step 3 cannot be edited by dataEditor and dataCleanser
  ...[AuthGroupName.dataEditor, AuthGroupName.dataCleanser].map((groupName) => ({
    title: `canEditRecord step 3: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyId: survey.id, surveyUuid: survey.uuid, step: '3' })
      return [user, record]
    },
    result: false,
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
