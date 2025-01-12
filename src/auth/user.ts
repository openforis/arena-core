import { ArenaObject, Dictionary } from '../common'
import { AuthGroup } from './authGroup'

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
  current?: number
}

export interface UserPrefs {
  surveys?: UserPrefSurveys
}

export interface UserProps {
  extra?: Dictionary<any>
  title?: UserTitle
}

export interface UserInvitation {
  expired: boolean
}

export interface UserAuthGroupProps {
  extra: Dictionary<any>
}

export interface UserAuthGroup extends AuthGroup {
  props: UserAuthGroupProps
}

export interface User extends ArenaObject<UserProps> {
  authGroups?: UserAuthGroup[]
  email: string
  hasProfilePicture: boolean
  name: string
  prefs?: UserPrefs
  status: UserStatus
  password?: string
  invitation?: UserInvitation
}
