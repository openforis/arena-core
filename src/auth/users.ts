import { User } from './user'
import { AuthGroup } from './authGroup'
import { AuthGroups } from './authGroups'

const getAuthGroups = (user: User): AuthGroup[] => user?.authGroups || []

const isSystemAdmin = (user: User): boolean => (getAuthGroups(user) || []).some(AuthGroups.isSystemAdminGroup)

const getAuthGroupBySurveyUuid = (surveyUuid?: string, includeSystemAdmin = true) => (
  user: User
): AuthGroup | undefined => {
  const authGroups = getAuthGroups(user)
  if (includeSystemAdmin && isSystemAdmin(user) && authGroups) {
    return authGroups[0]
  }

  return authGroups?.find((authGroup) => authGroup?.surveyUuid === surveyUuid)
}

export const Users = {
  isSystemAdmin,
  getAuthGroupBySurveyUuid,
}
