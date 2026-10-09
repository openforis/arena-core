import { describe, expect, test } from '@jest/globals'

import { RecordFactory } from '../../../record'
import { Survey } from '../../../survey'
import { AuthGroup, AuthGroupName } from '../../authGroup'
import { Authorizer } from '../../authorizer'
import { UserFactory } from '../../factory'
import { User } from '../../user'
import { createQueryTestCases } from './common'
import { canAnalyzeRecordQueries } from './record/canAnalyzeRecord'
import { canCleanseRecordQueries } from './record/canCleanseRecord'
import { canCreateRecordQueries } from './record/canCreateRecord'
import { canEditRecordQueries } from './record/canEditRecord'
import { canViewRecordQueries } from './record/canViewRecord'

const testCases = createQueryTestCases([
  // CREATE
  ...canCreateRecordQueries,
  // VIEW
  ...canViewRecordQueries,
  // UPDATE
  ...canEditRecordQueries,
  ...canCleanseRecordQueries,
  ...canAnalyzeRecordQueries,
])

describe('Authorizer - Record', () => {
  test.each(testCases)('$title', ({ authorizer, params, resultExpected }) => {
    expect(authorizer(...params)).toBe(resultExpected)
  })
})

describe('Authorizer - permission checks never throw', () => {
  const surveyUuid = 'survey-uuid'

  const createUser = (authGroups: AuthGroup[]): User => {
    const user = UserFactory.createInstance({ email: 'user@openforis-arena.org', name: 'user' })
    user.authGroups = authGroups
    return user
  }

  test('canEditRecord is false (not an error) for a survey group without record steps', () => {
    const user = createUser([{ name: AuthGroupName.dataEditor, surveyUuid }])
    const record = RecordFactory.createInstance({ surveyUuid, user })
    expect(Authorizer.canEditRecord(user, record)).toBe(false)
    expect(Authorizer.canDeleteRecord(user, record)).toBe(false)
  })

  test('survey checks without survey info', () => {
    const user = createUser([{ name: AuthGroupName.dataEditor, surveyUuid }])
    const systemAdmin = createUser([{ name: AuthGroupName.systemAdmin }])
    const noSurvey = undefined as unknown as Survey

    expect(Authorizer.canViewSurvey(user, noSurvey)).toBe(false)
    expect(Authorizer.canViewSurvey(systemAdmin, noSurvey)).toBe(true)
    expect(Authorizer.canViewNotOwnedRecords(user, noSurvey)).toBe(false)
    expect(Authorizer.canViewNotOwnedRecords(systemAdmin, noSurvey)).toBe(false)
  })
})
