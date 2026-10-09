import { describe, test, expect } from '@jest/globals'

import { AuthGroupName, UserFactory } from '../auth'
import { RecordFactory } from './factory'

const surveyUuid = 'survey-uuid'

const createUser = (authGroups: { name: AuthGroupName; surveyUuid?: string }[]) => {
  const user = UserFactory.createInstance({ email: 'user@openforis-arena.org', name: 'user' })
  user.authGroups = authGroups
  return user
}

describe('RecordFactory', () => {
  test('owner role is the name of the user group in the survey', () => {
    const user = createUser([{ name: AuthGroupName.dataEditor, surveyUuid }])
    const record = RecordFactory.createInstance({ surveyUuid, user })
    expect(record.ownerRole).toBe(AuthGroupName.dataEditor)
  })

  test('owner role is systemAdmin for a system administrator without a survey group', () => {
    const user = createUser([{ name: AuthGroupName.systemAdmin }])
    const record = RecordFactory.createInstance({ surveyUuid, user })
    expect(record.ownerRole).toBe(AuthGroupName.systemAdmin)
  })

  test('owner role is undefined for a user without a group in the survey', () => {
    const user = createUser([{ name: AuthGroupName.dataEditor, surveyUuid: 'other-survey-uuid' }])
    const record = RecordFactory.createInstance({ surveyUuid, user })
    expect(record.ownerRole).toBeUndefined()
  })
})
