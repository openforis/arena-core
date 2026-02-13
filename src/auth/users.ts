import { Dictionary } from '../common'
import { AuthGroupName } from './authGroup'
import { AuthGroups } from './authGroups'
import { User, UserAuthGroup, UserStatus } from './user'

const defaultMaxSurveys = 5

const hasAccepted = (user: User): boolean => user?.status === UserStatus.ACCEPTED

const getAuthGroups = (user: User): UserAuthGroup[] => user?.authGroups ?? []

const isSystemAdmin = (user: User): boolean => getAuthGroups(user).some(AuthGroups.isSystemAdmin)

const isSurveyManager = (user: User): boolean => getAuthGroups(user).some(AuthGroups.isSurveyManager)

const getAuthGroupBySurveyUuid =
  (surveyUuid?: string, includeSystemAdmin = true) =>
  (user: User): UserAuthGroup | undefined => {
    const authGroups = getAuthGroups(user)
    if (!authGroups) return undefined
    return includeSystemAdmin && isSystemAdmin(user)
      ? authGroups[0]
      : authGroups.find((authGroup) => authGroup.surveyUuid === surveyUuid)
  }

const getAuthGroupByName = (groupName: AuthGroupName) => (user: User) => {
  const authGroups = getAuthGroups(user)
  return authGroups.find((group) => group.name === groupName)
}

const getCombinedExtraProps =
  (surveyUuid: string) =>
  (user: User): Dictionary<any> => {
    const userSurveyAuthGroup = user ? Users.getAuthGroupBySurveyUuid(surveyUuid)(user) : null
    const userAuthGroupExtraProps = userSurveyAuthGroup?.props?.extra ?? {}
    const userExtraProps = user?.props.extra ?? {}
    // user auth group extra props overwrite user extra props
    return { ...userExtraProps, ...userAuthGroupExtraProps }
  }

const getMaxSurveys = (user: User) => user.props?.maxSurveys ?? defaultMaxSurveys

const isEqual =
  (userToCompare: User) =>
  (user: User): boolean =>
    user && userToCompare ? user === userToCompare || user.uuid === userToCompare.uuid : false

export const Users = {
  hasAccepted,
  getAuthGroups,
  isSystemAdmin,
  isSurveyManager,
  getAuthGroupBySurveyUuid,
  getAuthGroupByName,
  getCombinedExtraProps,
  getMaxSurveys,
  isEqual,
}
