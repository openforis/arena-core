import { UUIDs } from '../utils'
import { AuthGroup, AuthGroupName, DEFAULT_AUTH_GROUPS } from './authGroup'
import { RecordStepPermission } from './permission'

const isSystemAdminGroup = (authGroup: AuthGroup): boolean => authGroup?.name === AuthGroupName.systemAdmin

const getRecordSteps = (authGroup?: AuthGroup): { [key: string]: RecordStepPermission } | undefined =>
  authGroup?.recordSteps

const getRecordEditLevel = (step: string) => (authGroup?: AuthGroup): RecordStepPermission => {
  const steps = getRecordSteps(authGroup)
  if (!steps) throw new Error('No steps')

  return steps[step]
}

const getDefaultGroups = (surveyUuid: string): AuthGroup[] =>
  DEFAULT_AUTH_GROUPS.map((group) => ({ ...group, uuid: UUIDs.v4(), surveyUuid }))

export const AuthGroups = {
  isSystemAdminGroup,
  getRecordEditLevel,
  getDefaultGroups,
}
