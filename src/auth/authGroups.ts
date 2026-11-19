import { UUIDs } from '../utils'
import {
  ArenaAuthGroup,
  AuthGroupName,
  createDefaultAuthGroups,
  permissionsByGroupName,
  sortedGroupNames,
} from './authGroup'
import { RecordStepPermission } from './permission'

const isSystemAdmin = (authGroup: ArenaAuthGroup): boolean => authGroup?.name === AuthGroupName.systemAdmin

const isSurveyManager = (authGroup: ArenaAuthGroup): boolean => authGroup?.name === AuthGroupName.surveyManager

const isSurveyGroup = (authGroup: ArenaAuthGroup): boolean => !isSystemAdmin(authGroup) && !isSurveyManager(authGroup)

const getSurveyUuid = (authGroup: ArenaAuthGroup): string | undefined => authGroup?.surveyUuid

const getRecordSteps = (authGroup?: ArenaAuthGroup): { [key: string]: RecordStepPermission } | undefined =>
  authGroup?.recordSteps

const getDefaultAuthGroups = (surveyUuid: string): ArenaAuthGroup[] =>
  createDefaultAuthGroups().map((group) => ({ ...group, uuid: UUIDs.v4(), surveyUuid }))

const getPermissions = (group: ArenaAuthGroup) => permissionsByGroupName[group.name] ?? []

const sortGroups = (groups: ArenaAuthGroup[]) => {
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
  getDefaultAuthGroups,
  getPermissions,
  sortGroups,
}
