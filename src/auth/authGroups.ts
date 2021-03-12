import { UUIDs } from '../utils'
import { AuthGroup, AuthGroupName, DEFAULT_AUTH_GROUPS } from './authGroup'
import { RecordStepPermission } from './permission'

const isSystemAdminGroup = (authGroup: AuthGroup): boolean => authGroup.name === AuthGroupName.systemAdmin

const getRecordSteps = (authGroup?: AuthGroup): { [key: string]: RecordStepPermission } | undefined =>
  authGroup?.recordSteps

const getRecordEditLevel = (step: string) => (authGroup?: AuthGroup): RecordStepPermission | undefined => {
  const steps = getRecordSteps(authGroup)
  if (!steps) return
  return steps[step]
}

const getDefaultGroups = (): AuthGroup[] => DEFAULT_AUTH_GROUPS.map((group) => ({ ...group, uuid: UUIDs.v4() }))

export const AuthGroups = {
  isSystemAdminGroup,
  getRecordEditLevel,
  getDefaultGroups,
}
