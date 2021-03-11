import { User } from './user'
import { AuthGroup} from './authGroup'
import { AuthGroups } from './authGroups'

const getAuthGroups = (user:User):AuthGroup[] => user?.authGroups || []

const isSystemAdmin =  (user:User):boolean => (getAuthGroups(user) || []).some(AuthGroups.isSystemAdminGroup)

const getAuthGroupBySurveyUuid= (surveyUuid?: string, includeSystemAdmin = true) => (user: User):AuthGroup => {
  const authGroups = getAuthGroups(user)
  return includeSystemAdmin && isSystemAdmin(user) && authGroups ? authGroups[0] : authGroups?.find(group => group.surveyUuid === surveyUuid)  
}

export const Users = {
  isSystemAdmin,
  getAuthGroupBySurveyUuid
}
