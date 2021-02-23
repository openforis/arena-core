import { Survey } from 'src/survey'
import { AuthGroup } from 'src/auth';
import { userStatus } from './userStatus';

export interface Prefs {
  surveys: Array<Survey>
}

export interface User {
  uuid: string
  name: string
  email: string
  prefs: Prefs
  props?: any
  status: userStatus
  hasProfilePicture: boolean
  authGroups: AuthGroup[]
}
