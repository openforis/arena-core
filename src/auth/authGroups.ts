import { AuthGroup, AuthGroupName } from './authGroup'
import { RecordStepPermission } from './permission'

const isSystemAdminGroup = (authGroup: AuthGroup): boolean => authGroup.name === AuthGroupName.systemAdmin

const getRecordSteps = (authGroup?: AuthGroup): { [key: string]: RecordStepPermission } | undefined =>
  authGroup?.recordSteps

const getRecordEditLevel = (step?: RecordStepPermission) => (
  authGroup?: AuthGroup
): RecordStepPermission | undefined => {
  if (!step) return
  const steps = getRecordSteps(authGroup)
  if (!steps) return
  return steps[step]
}

export const AuthGroups = {
  isSystemAdminGroup,
  getRecordEditLevel,
}
