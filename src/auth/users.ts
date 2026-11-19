import { ArenaDictionary } from '../common'
import { AuthGroupName } from './authGroup'
import { AuthGroups } from './authGroups'
import { ArenaUser, ArenaUserAuthGroup, UserStatus } from './user'

const defaultMaxSurveys = 5

const hasAccepted = (user: ArenaUser): boolean => user?.status === UserStatus.ACCEPTED

const getAuthGroups = (user: ArenaUser): ArenaUserAuthGroup[] => user?.authGroups ?? []

const isSystemAdmin = (user: ArenaUser): boolean => getAuthGroups(user).some(AuthGroups.isSystemAdmin)

const isSurveyManager = (user: ArenaUser): boolean => getAuthGroups(user).some(AuthGroups.isSurveyManager)

const getAuthGroupBySurveyUuid =
  (surveyUuid?: string, includeSystemAdmin = true) =>
  (user: ArenaUser): ArenaUserAuthGroup | undefined => {
    const authGroups = getAuthGroups(user)
    if (includeSystemAdmin && isSystemAdmin(user)) return authGroups.find(AuthGroups.isSystemAdmin)
    // without a survey uuid no survey group can match (groups not associated to a survey, e.g. survey manager, have no survey uuid)
    if (!surveyUuid) return undefined
    return authGroups.find((authGroup) => authGroup.surveyUuid === surveyUuid)
  }

const getAuthGroupByName = (groupName: AuthGroupName) => (user: ArenaUser) => {
  const authGroups = getAuthGroups(user)
  return authGroups.find((group) => group.name === groupName)
}

const getCombinedExtraProps =
  (surveyUuid: string) =>
  (user: ArenaUser): ArenaDictionary<any> => {
    const userSurveyAuthGroup = user ? Users.getAuthGroupBySurveyUuid(surveyUuid)(user) : null
    const userAuthGroupExtraProps = userSurveyAuthGroup?.props?.extra ?? {}
    const userExtraProps = user?.props.extra ?? {}
    // user auth group extra props overwrite user extra props
    return { ...userExtraProps, ...userAuthGroupExtraProps }
  }

const getMaxSurveys = (user: ArenaUser) => user.props?.maxSurveys ?? defaultMaxSurveys

const isEqual =
  (userToCompare: ArenaUser) =>
  (user: ArenaUser): boolean =>
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
