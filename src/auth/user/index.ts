import { AuthGroup } from 'src/auth'

export enum UserStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  FORCE_CHANGE_PASSWORD = 'FORCE_CHANGE_PASSWORD',
}

type UserSurvey = { cycle: number }

export interface UserSurveys {
  [key: number]: UserSurvey
  current: number
}

export interface UserPrefs {
  surveys: UserSurveys
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
  props: UserProps
  status: UserStatus
  hasProfilePicture: boolean
  authGroups: AuthGroup[]
}
