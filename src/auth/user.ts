import { ArenaObject } from 'src/common'
import { AuthGroup, AuthGroupMethods} from './authGroup'

export enum UserStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  FORCE_CHANGE_PASSWORD = 'FORCE_CHANGE_PASSWORD',
}

export enum UserTitle {
  mr = 'mr',
  ms = 'ms',
  preferNotToSay = 'preferNotToSay',
}

export interface UserPrefSurveys {
  [surveyId: number]: { cycle: number }
  current: number
}

export interface UserPrefs {
  surveys?: UserPrefSurveys
}

export interface UserProps {
  title?: UserTitle
}

export interface User extends ArenaObject<UserProps> {
  authGroups?: Array<AuthGroup>
  email: string
  hasProfilePicture: boolean
  name: string
  prefs?: UserPrefs
  status: UserStatus
}


// Methods

const getAuthGroups = (user:User):AuthGroup[] => user?.authGroups || []

const isSystemAdmin =  (user:User):boolean => (getAuthGroups(user) || []).some(AuthGroupMethods.isSystemAdminGroup)

const getAuthGroupBySurveyUuid= (surveyUuid: string | undefined, includeSystemAdmin = true) => (user: User):AuthGroup | undefined => {
  const authGroups = getAuthGroups(user)
  return includeSystemAdmin && isSystemAdmin(user) && authGroups ? authGroups[0] : authGroups?.find(group => group.surveyUuid === surveyUuid)  
}

// Getters
const getUuid = (user:User): string => user.uuid

// ====== CHECK ( Object Utils )
const isEqual = (other: User) => (self: User): boolean => getUuid(other) === getUuid(self)
const hasAccepted = (user: User): boolean => user.status === UserStatus.ACCEPTED

export const UserMethods = {
  isSystemAdmin,
  getAuthGroupBySurveyUuid,
  //Getters
  getUuid,
  //check
  isEqual,
  hasAccepted
}