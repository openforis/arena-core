import { User, UserAuthGroup } from './user'
import { AuthGroups } from './authGroups'
import { Dictionary } from '../common'

const getAuthGroups = (user: User): UserAuthGroup[] => user?.authGroups ?? []

const isSystemAdmin = (user: User): boolean => (getAuthGroups(user) ?? []).some(AuthGroups.isSystemAdmin)

const getAuthGroupBySurveyUuid =
  (surveyUuid?: string, includeSystemAdmin = true) =>
  (user: User): UserAuthGroup | undefined => {
    const authGroups = getAuthGroups(user)
    if (!authGroups) return undefined
    return includeSystemAdmin && isSystemAdmin(user)
      ? authGroups[0]
      : authGroups.find((authGroup) => authGroup.surveyUuid === surveyUuid)
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

export const Users = {
  isSystemAdmin,
  getAuthGroupBySurveyUuid,
  getCombinedExtraProps,
}
