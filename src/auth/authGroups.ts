import { AuthGroup, AuthGroupName} from './authGroup'


const isSystemAdminGroup = (authGroup: AuthGroup):boolean => authGroup.name === AuthGroupName.systemAdmin

const getRecordSteps = (authGroup: AuthGroup): { [key: number]: string } => authGroup.recordSteps

const getRecordEditLevel = (step?: string) => (authGroup?: AuthGroup): string => {
  const steps = getRecordSteps(authGroup)
  //R.pipe(getRecordSteps, R.prop(step))
  // TODO redo this function
  //return steps
  return 'all'
}

export const AuthGroups = {
  isSystemAdminGroup,
  getRecordEditLevel
}
