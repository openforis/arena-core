import { describe, test, expect } from '@jest/globals'

import { AuthGroupName } from './authGroup'
import { UserFactory } from './factory'
import { Users } from './users'

describe('Users.getAuthGroupBySurveyUuid', () => {
  test('returns the systemAdmin group for a system administrator, even if it is not the first one', () => {
    const user = UserFactory.createInstance({ email: 'admin@openforis-arena.org', name: 'admin' })
    user.authGroups = [
      { name: AuthGroupName.dataEditor, surveyUuid: 'survey-uuid' },
      { name: AuthGroupName.systemAdmin },
    ]
    expect(Users.getAuthGroupBySurveyUuid('other-survey-uuid')(user)?.name).toBe(AuthGroupName.systemAdmin)
  })

  test('returns the survey group when system admin groups are excluded', () => {
    const user = UserFactory.createInstance({ email: 'admin@openforis-arena.org', name: 'admin' })
    user.authGroups = [
      { name: AuthGroupName.systemAdmin },
      { name: AuthGroupName.dataEditor, surveyUuid: 'survey-uuid' },
    ]
    expect(Users.getAuthGroupBySurveyUuid('survey-uuid', false)(user)?.name).toBe(AuthGroupName.dataEditor)
  })
})
