import { UUIDs } from '../utils'
import {
  AuthGroup,
  AuthGroupName,
  createDefaultAuthGroups,
  permissionsByGroupName,
  sortedGroupNames,
} from './authGroup'
import { RecordStepPermission } from './permission'

const isSystemAdmin = (authGroup: AuthGroup): boolean => authGroup?.name === AuthGroupName.systemAdmin

const isSurveyManager = (authGroup: AuthGroup): boolean => authGroup?.name === AuthGroupName.surveyManager

const isSurveyGroup = (authGroup: AuthGroup): boolean => !isSystemAdmin(authGroup) && !isSurveyManager(authGroup)

const getSurveyUuid = (authGroup: AuthGroup): string | undefined => authGroup?.surveyUuid

const getRecordSteps = (authGroup?: AuthGroup): { [key: string]: RecordStepPermission } | undefined =>
  authGroup?.recordSteps

/**
 * @deprecated Not used by Arena; it throws when the group has no record steps.
 * Use `getRecordSteps(authGroup)?.[step]` or the `Authorizer` record checks instead.
 */
const getRecordEditLevel =
  (step: string) =>
  (authGroup?: AuthGroup): RecordStepPermission => {
    const steps = getRecordSteps(authGroup)
    if (!steps) throw new Error('No steps')

    return steps[step]
  }

const getDefaultAuthGroups = (surveyUuid: string): AuthGroup[] =>
  createDefaultAuthGroups().map((group) => ({ ...group, uuid: UUIDs.v4(), surveyUuid }))

const getPermissions = (group: AuthGroup) => permissionsByGroupName[group.name] ?? []

const sortGroups = (groups: AuthGroup[]) => {
  const sortedGroups = [...groups]
  sortedGroups.sort((group1, group2) => {
    const sortOrder1 = sortedGroupNames.indexOf(group1.name)
    const sortOrder2 = sortedGroupNames.indexOf(group2.name)
    return sortOrder1 - sortOrder2
  })
  return sortedGroups
}

export const AuthGroups = {
  isSystemAdmin,
  isSurveyGroup,
  isSurveyManager,
  getSurveyUuid,
  getRecordSteps,
  getRecordEditLevel,
  getDefaultAuthGroups,
  getPermissions,
  sortGroups,
}
