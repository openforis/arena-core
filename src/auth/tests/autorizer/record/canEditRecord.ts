import { Survey } from '../../../../survey'
import { RECORD_STEP_DEFAULT } from '../../../../record'
import { RecordFactory } from '../../../../record'
import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'
import { UserFactory } from '../../../factory'
import { User } from '../../../user'

import { Query } from '../user/common'

const createRecord = (params: { user: User; survey: Survey; step?: string }) =>
  RecordFactory.createInstance({
    user: params.user,
    surveyUuid: params.survey.uuid,
    step: params.step || RECORD_STEP_DEFAULT,
  })

export const canEditRecordQueries: Query[] = [
  // system admin can
  {
    title: `canEditRecord: systemAdmin can`,
    groups: [AuthGroupName.systemAdmin],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => [user, createRecord({ user, survey })],
    result: true,
  },
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
    getParams: ({ user, survey }: any): any[] => [user, createRecord({ user, survey })],
    result: true,
  })),
  // record cannot be edited if auth group is dataEditor and record is not owned by the user
  {
    title: `canEditRecord (not owned record): dataEditor cannot`,
    groups: [AuthGroupName.dataEditor],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const thirdUser = UserFactory.createInstance({ email: 'third@arena.org', name: 'third user' })
      const record = RecordFactory.createInstance({ user: thirdUser, surveyUuid: survey.uuid })
      return [user, record]
    },
    result: false,
  },
  // record in step 2 can be edited by all groups but dataEditor
  ...[AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst, AuthGroupName.dataCleanser].map(
    (groupName) => ({
      title: `canEditRecord step 2: ${groupName} can`,
      groups: [groupName],
      authorizer: Authorizer.canEditRecord,
      getParams: ({ user, survey }: any): any[] => [user, createRecord({ user, survey, step: '2' })],
      result: true,
    })
  ),
  // record in step 2 cannot be edited by dataEditor
  ...[AuthGroupName.dataEditor].map((groupName) => ({
    title: `canEditRecord step 2: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => [user, createRecord({ user, survey, step: '2' })],

    result: false,
  })),
  // record in step 3 can be edited by all groups but dataEditor
  ...[AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst].map((groupName) => ({
    title: `canEditRecord step 3: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => [user, createRecord({ user, survey, step: '3' })],

    result: true,
  })),
  // record in step 3 cannot be edited by dataEditor and dataCleanser
  ...[AuthGroupName.dataEditor, AuthGroupName.dataCleanser].map((groupName) => ({
    title: `canEditRecord step 3: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canEditRecord,
    getParams: ({ user, survey }: any): any[] => {
      const record = RecordFactory.createInstance({ user, surveyUuid: survey.uuid, step: '3' })
      return [user, record]
    },
    result: false,
  })),
]
