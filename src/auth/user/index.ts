import { Survey } from 'src/survey'
import { AuthGroup } from 'src/auth'

export enum UserStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  FORCE_CHANGE_PASSWORD = 'FORCE_CHANGE_PASSWORD',
}

export interface UserSurveys {
  [key: number]: Survey
  current: string
}

export interface UserPrefs {
  surveys: Array<Survey>
}
export enum UserTitle {
  mr = 'mr',
  ms = 'ms',
}

export interface UserProps {
  title: UserTitle
}

export interface User {
  uuid: string
  name: string
  email: string
  prefs: UserPrefs
  props?: UserProps
  status: UserStatus
  hasProfilePicture: boolean
  authGroups: AuthGroup[]
}
