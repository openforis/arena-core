import { AuthGroup } from './authGroup'

export enum UserStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  FORCE_CHANGE_PASSWORD = 'FORCE_CHANGE_PASSWORD',
}

export enum UserTitle {
  mr = 'mr',
  ms = 'ms',
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

export interface User {
  authGroups?: Array<AuthGroup>
  email: string
  hasProfilePicture: boolean
  name: string
  prefs: UserPrefs
  props: UserProps
  status: UserStatus
  uuid: string
}
