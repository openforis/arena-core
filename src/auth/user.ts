import { ArenaObject, ArenaDictionary } from '../common'
import { ArenaAuthGroup } from './authGroup'

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

export interface ArenaUserPrefSurveys {
  [surveyId: number]: { cycle: number }
  current?: number
}

export interface ArenaUserPrefs {
  surveys?: ArenaUserPrefSurveys
}

export interface ArenaUserProps {
  extra?: ArenaDictionary<any>
  // private props (visible only to the user itself)
  mapApiKeyByProvider?: ArenaDictionary<string>
  // restricted props (editable only by system admins)
  maxSurveys?: number
  title?: UserTitle
}

export interface ArenaUserInvitation {
  expired: boolean
}

export interface ArenaUserAuthGroupProps {
  extra: ArenaDictionary<any>
}

export interface ArenaUserAuthGroup extends ArenaAuthGroup {
  props?: ArenaUserAuthGroupProps
}

export interface ArenaUser extends ArenaObject<ArenaUserProps> {
  authGroups?: ArenaUserAuthGroup[]
  email: string
  hasProfilePicture: boolean
  name: string
  prefs?: ArenaUserPrefs
  status: UserStatus
  password?: string
  invitation?: ArenaUserInvitation
}
