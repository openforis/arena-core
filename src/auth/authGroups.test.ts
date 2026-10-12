import { describe, expect, test } from '@jest/globals'

import { SurveyFactory } from '../survey'
import { AuthGroupName, DEFAULT_AUTH_GROUPS, permissionsByGroupName } from './authGroup'
import { AuthGroups } from './authGroups'
import { Permission, RecordStepPermission } from './permission'

const expectedSurveyAdminPermissions = [...permissionsByGroupName[AuthGroupName.surveyAdmin]]
const expectedSurveyAdminRecordSteps = {
  ...DEFAULT_AUTH_GROUPS.find((group) => group.name === AuthGroupName.surveyAdmin)!.recordSteps,
}

const getSurveyAdminGroup = (groups: ReturnType<typeof AuthGroups.getDefaultAuthGroups>) =>
  groups.find((group) => group.name === AuthGroupName.surveyAdmin)!

const changeInPlace = (group: ReturnType<typeof getSurveyAdminGroup>) => {
  group.permissions!.push(Permission.surveyCreate)
  group.recordSteps![1] = RecordStepPermission.own
}

const expectDefaultsUnchanged = () => {
  expect(permissionsByGroupName[AuthGroupName.surveyAdmin]).toEqual(expectedSurveyAdminPermissions)
  expect(getSurveyAdminGroup(DEFAULT_AUTH_GROUPS).permissions).toEqual(expectedSurveyAdminPermissions)
  expect(getSurveyAdminGroup(DEFAULT_AUTH_GROUPS).recordSteps).toEqual(expectedSurveyAdminRecordSteps)
}

describe('AuthGroups.getDefaultAuthGroups', () => {
  test('groups of different surveys do not share permissions and record steps', () => {
    const groups1 = AuthGroups.getDefaultAuthGroups('survey-1')
    const groups2 = AuthGroups.getDefaultAuthGroups('survey-2')

    changeInPlace(getSurveyAdminGroup(groups1))

    expect(getSurveyAdminGroup(groups2).permissions).toEqual(expectedSurveyAdminPermissions)
    expect(getSurveyAdminGroup(groups2).recordSteps).toEqual(expectedSurveyAdminRecordSteps)
    expectDefaultsUnchanged()
  })

  test('in place changes do not alter the permissions used by the permission checks', () => {
    changeInPlace(getSurveyAdminGroup(AuthGroups.getDefaultAuthGroups('survey-1')))

    expect(AuthGroups.getPermissions({ name: AuthGroupName.surveyAdmin })).toEqual(expectedSurveyAdminPermissions)
  })
})

describe('SurveyFactory default auth groups', () => {
  test('surveys do not share the default groups permissions and record steps', () => {
    const survey1 = SurveyFactory.createInstance({ ownerUuid: 'owner', name: 'survey_1' })
    const survey2 = SurveyFactory.createInstance({ ownerUuid: 'owner', name: 'survey_2' })

    changeInPlace(getSurveyAdminGroup(survey1.authGroups))

    expect(getSurveyAdminGroup(survey2.authGroups).permissions).toEqual(expectedSurveyAdminPermissions)
    expectDefaultsUnchanged()
  })
})
