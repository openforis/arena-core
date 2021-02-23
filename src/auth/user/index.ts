import { Survey } from 'src/survey'
import { AuthGroup } from 'src/auth'
import { UserStatus } from './userStatus'

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
