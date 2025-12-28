import { Record, Records } from '../record'
import { Survey, Surveys } from '../survey'
import { AuthGroup, AuthGroupName } from './authGroup'
import { AuthGroups } from './authGroups'
import { Permission, RecordStepPermission } from './permission'
import { User } from './user'
import { Users } from './users'

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user: User, surveyInfo: Survey, includeSystemAdmin = true): AuthGroup | undefined =>
  Users.getAuthGroupBySurveyUuid(surveyInfo.uuid, includeSystemAdmin)(user)

const _hasAuthGroupForSurvey = ({ user, surveyInfo }: { user: User; surveyInfo: Survey }): boolean =>
  Boolean(_getSurveyUserGroup(user, surveyInfo))

const _hasSurveyPermission =
  (permission: Permission) =>
  (user: User, surveyInfo: Survey): boolean => {
    if (!user) return false

    if (Users.isSystemAdmin(user)) return true

    if (!surveyInfo) return false

    const authGroup = _getSurveyUserGroup(user, surveyInfo)
    if (!authGroup) return false

    return AuthGroups.getPermissions(authGroup).includes(permission)
  }

const _hasPermissionInSomeGroup =
  (permission: Permission) =>
  (user: User): boolean => {
    if (Users.isSystemAdmin(user)) return true
    const groups = Users.getAuthGroups(user)
    return groups.some((group) => AuthGroups.getPermissions(group).includes(permission))
  }

// CREATE
const canCreateSurvey = _hasPermissionInSomeGroup(Permission.surveyCreate)
const canCreateTemplate = (user: User): boolean => Users.isSystemAdmin(user)
const getMaxSurveysUserCanCreate = (user: User): number => {
  if (Users.isSystemAdmin(user)) return Number.NaN
  if (canCreateSurvey(user)) return Users.getMaxSurveys(user)
  return 0
}

// READ
const canViewSurvey = (user: User, surveyInfo: Survey): boolean =>
  Users.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo })
const canExportSurvey = _hasSurveyPermission(Permission.recordAnalyse)
const canExportSurveysList = (user: User): boolean => Users.isSystemAdmin(user)
const canViewTemplates = (user: User): boolean => Users.isSystemAdmin(user)
// UPDATE
const canEditSurvey = _hasSurveyPermission(Permission.surveyEdit)
const canEditSurveyConfig = (user: User): boolean => Users.isSystemAdmin(user)
const canEditSurveyOwner = (user: User): boolean => Users.isSystemAdmin(user)
const canEditTemplates = (user: User): boolean => Users.isSystemAdmin(user)
const canRefreshAllSurveyRdbs = (user: User): boolean => Users.isSystemAdmin(user)

// ======
// ====== Record
// ======

// CREATE
export const canCreateRecord = _hasSurveyPermission(Permission.recordCreate)

// READ
export const canViewRecord = _hasSurveyPermission(Permission.recordView)
export const canExportAllRecords = _hasSurveyPermission(Permission.recordCleanse)
export const canViewNotOwnedRecords = (user: User, surveyInfo: Survey): boolean => {
  if (!canViewSurvey(user, surveyInfo)) return false
  if (canExportAllRecords(user, surveyInfo)) return true
  const { uuid: surveyUuid } = surveyInfo
  const groupInCurrentSurvey = Users.getAuthGroupBySurveyUuid(surveyUuid)(user)
  return (
    groupInCurrentSurvey?.name === AuthGroupName.dataEditor &&
    Surveys.isDataEditorViewNotOwnedRecordsAllowed(surveyInfo)
  )
}
export const canExportRecordsList = _hasSurveyPermission(Permission.surveyEdit)

// UPDATE
export const canEditRecord = (user: User, record: Record, allowAnalysisStepEdit = false): boolean => {
  if (
    !user ||
    !record ||
    // records in analysis cannot be edited
    (!allowAnalysisStepEdit && Records.isInAnalysisStep(record))
  ) {
    return false
  }
  // system admin does not have an auth group associated to the survey, but he can always edit records;
  if (Users.isSystemAdmin(user)) {
    return true
  }
  const { surveyUuid, ownerUuid } = record
  // if user doesn't have an auth group associated to the survey, he cannot edit records
  const userAuthGroup = Users.getAuthGroupBySurveyUuid(surveyUuid)(user)
  if (!userAuthGroup) return false

  // Level = 'all' or 'own'. If 'own', user can only edit records assigned to him
  // If 'all', he can edit all survey's records
  const level = AuthGroups.getRecordEditLevel(Records.getStep(record))(userAuthGroup)
  return level === RecordStepPermission.all || (level === RecordStepPermission.own && ownerUuid === user.uuid)
}

const canChangeRecordProps = (user: User, record: Record) => canEditRecord(user, record, true)

const canDeleteRecord = canEditRecord

const canDemoteRecord = canChangeRecordProps

const canChangeRecordOwner = canChangeRecordProps

const canChangeRecordStep = canChangeRecordProps

const canCleanseRecords = _hasSurveyPermission(Permission.recordCleanse)

const canExportRecords = _hasSurveyPermission(Permission.recordView)

const canImportRecords = (user: User, surveyInfo: Survey) =>
  surveyInfo?.published && _hasSurveyPermission(Permission.recordCreate)(user, surveyInfo)

const canAnalyzeRecords = _hasSurveyPermission(Permission.recordAnalyse)

const canUpdateRecordsStep = canAnalyzeRecords

// ======
// ====== Explorer
// ======

const canUseExplorer = canCleanseRecords

// ======
// ====== Map
// ======

const canUseMap = canAnalyzeRecords

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = _hasSurveyPermission(Permission.userInvite)

// READ
const canViewSurveyUsers = _hasSurveyPermission(Permission.userInvite)

const _usersBelongToSameSurvey = ({ user, userToView }: { user: User; userToView: User }) =>
  Users.getAuthGroups(user).some(
    (authGroupUser) =>
      AuthGroups.isSurveyGroup(authGroupUser) &&
      Users.getAuthGroups(userToView).some(
        (authGroupUserToView) =>
          AuthGroups.isSurveyGroup(authGroupUserToView) &&
          AuthGroups.getSurveyUuid(authGroupUserToView) === AuthGroups.getSurveyUuid(authGroupUser)
      )
  )

const canViewUser = (user: User, userToView: User) =>
  Users.isSystemAdmin(user) || Users.isEqual(userToView)(user) || _usersBelongToSameSurvey({ user, userToView })

const canViewOtherUsersEmail = ({ user, surveyInfo }: { user: User; surveyInfo: Survey }) =>
  Users.isSystemAdmin(user) || canInviteUsers(user, surveyInfo)

const canViewOtherUsersNameInSameSurvey = (user: User, surveyInfo: Survey): boolean =>
  _hasSurveyPermission(Permission.recordView)(user, surveyInfo)

const canViewAllUsers = (user: User) => Users.isSystemAdmin(user)

// EDIT
const _hasUserEditAccess = (user: User, surveyInfo: Survey, userToUpdate: User): boolean =>
  Users.isSystemAdmin(user) ||
  (_hasSurveyPermission(Permission.userEdit)(user, surveyInfo) &&
    // user to update has an auth group in the same survey
    _hasAuthGroupForSurvey({ user: userToUpdate, surveyInfo }))

const canCreateUsers = (user: User): boolean => Users.isSystemAdmin(user)

const canEditUser = (user: User, surveyInfo: Survey, userToUpdate: User): boolean =>
  Users.hasAccepted(userToUpdate) &&
  (Users.isEqual(user)(userToUpdate) || _hasUserEditAccess(user, surveyInfo, userToUpdate))

const canEditUserEmail = (user: User): boolean => Users.isSystemAdmin(user)

const canEditUserGroup = (user: User, surveyInfo: Survey, userToUpdate: User): boolean =>
  !Users.isEqual(user)(userToUpdate) && _hasUserEditAccess(user, surveyInfo, userToUpdate)

const canRemoveUser = (user: User, surveyInfo: Survey, userToRemove: User): boolean =>
  !Users.isEqual(user)(userToRemove) &&
  !Users.isSystemAdmin(userToRemove) &&
  _hasUserEditAccess(user, surveyInfo, userToRemove)

const canEditUserSurveyManager = (user: User) => Users.isSystemAdmin(user)
const canEditUserMaxSurveys = (user: User) => Users.isSystemAdmin(user)

// USER ACCESS REQUESTS
const canViewUsersAccessRequests = (user: User): boolean => Users.isSystemAdmin(user)
const canEditUsersAccessRequests = (user: User): boolean => Users.isSystemAdmin(user)

// INVITE
const getUserGroupsCanAssign = ({
  user,
  surveyInfo = null,
  editingLoggedUser = false,
  showOnlySurveyGroups = false,
}: {
  user: User
  surveyInfo?: Survey | null
  editingLoggedUser?: boolean
  showOnlySurveyGroups?: boolean
}) => {
  const groups = []

  let surveyGroups: AuthGroup[] = []
  if (editingLoggedUser && !surveyInfo) {
    // This can happen for system administrators when they don't have an active survey
    surveyGroups = []
  } else if (surveyInfo) {
    if (surveyInfo.published) {
      surveyGroups = Surveys.getAuthGroups(surveyInfo)
    } else {
      const adminGroup = Surveys.getAuthGroupAdmin(surveyInfo)
      surveyGroups = adminGroup ? [adminGroup] : []
    }
  }

  // do not allow surveyEditor group selection (remove surveyEditor group completely?)
  surveyGroups = surveyGroups.filter((group) => group.name !== AuthGroupName.surveyEditor)

  groups.push(...surveyGroups)

  if (!showOnlySurveyGroups && (Users.isSystemAdmin(user) || Users.isSurveyManager(user))) {
    // Add SystemAdmin or SurveyManager group if current user is a SystemAdmin or SurveyManager himself
    const userNonSurveyGroups = Users.getAuthGroups(user).filter((group) => !AuthGroups.isSurveyGroup(group))
    groups.push(...userNonSurveyGroups)
  }
  return AuthGroups.sortGroups(groups)
}

export const Authorizer = {
  // Survey
  canCreateSurvey,
  canCreateTemplate,
  getMaxSurveysUserCanCreate,
  canViewSurvey,
  canExportSurvey,
  canExportSurveysList,
  canViewTemplates,
  canEditSurvey,
  canEditSurveyConfig,
  canEditSurveyOwner,
  canEditTemplates,
  canRefreshAllSurveyRdbs,
  // Record
  canCreateRecord,
  canViewRecord,
  canExportAllRecords,
  canViewNotOwnedRecords,
  canExportRecordsList,
  canEditRecord,
  canDeleteRecord,
  canDemoteRecord,
  canChangeRecordOwner,
  canChangeRecordStep,
  canCleanseRecords,
  canExportRecords,
  canImportRecords,
  canAnalyzeRecords,
  canUpdateRecordsStep,
  // Explorer
  canUseExplorer,
  // Map
  canUseMap,
  // Users
  canInviteUsers,
  canViewSurveyUsers,
  canViewUser,
  canViewOtherUsersEmail,
  canViewOtherUsersNameInSameSurvey,
  canViewAllUsers,
  canCreateUsers,
  canEditUser,
  canEditUserEmail,
  canEditUserGroup,
  canRemoveUser,
  canEditUserSurveyManager,
  canEditUserMaxSurveys,
  // User Access Requests
  canViewUsersAccessRequests,
  canEditUsersAccessRequests,
  // Invite
  getUserGroupsCanAssign,
}
