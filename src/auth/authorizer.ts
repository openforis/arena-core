import { ArenaRecord, Records } from '../record'
import { ArenaSurvey, Surveys } from '../survey'
import { ArenaAuthGroup, AuthGroupName } from './authGroup'
import { AuthGroups } from './authGroups'
import { Permission, RecordStepPermission } from './permission'
import { ArenaUser } from './user'
import { Users } from './users'

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (
  user: ArenaUser,
  surveyInfo: ArenaSurvey,
  includeSystemAdmin = true
): ArenaAuthGroup | undefined =>
  surveyInfo ? Users.getAuthGroupBySurveyUuid(surveyInfo.uuid, includeSystemAdmin)(user) : undefined

// system admins are not considered as members of the survey, so survey admins cannot edit them
const _hasAuthGroupForSurvey = ({ user, surveyInfo }: { user: ArenaUser; surveyInfo: ArenaSurvey }): boolean =>
  Boolean(_getSurveyUserGroup(user, surveyInfo, false))

const _hasSurveyPermission =
  (permission: Permission) =>
  (user: ArenaUser, surveyInfo: ArenaSurvey): boolean => {
    if (!user) return false

    if (Users.isSystemAdmin(user)) return true

    if (!surveyInfo) return false

    const authGroup = _getSurveyUserGroup(user, surveyInfo)
    if (!authGroup) return false

    return AuthGroups.getPermissions(authGroup).includes(permission)
  }

const _hasPermissionInSomeGroup =
  (permission: Permission) =>
  (user: ArenaUser): boolean => {
    if (Users.isSystemAdmin(user)) return true
    const groups = Users.getAuthGroups(user)
    return groups.some((group) => AuthGroups.getPermissions(group).includes(permission))
  }

// CREATE
const canCreateSurvey = _hasPermissionInSomeGroup(Permission.surveyCreate)
const canCreateTemplate = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const getMaxSurveysUserCanCreate = (user: ArenaUser): number => {
  if (Users.isSystemAdmin(user)) return Number.NaN
  if (canCreateSurvey(user)) return Users.getMaxSurveys(user)
  return 0
}

// READ
const canViewSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  Users.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo })
// any logged in user can view a published template (e.g. to clone it), without widening canViewSurvey
const canViewSurveyOrPublishedTemplate = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  canViewSurvey(user, surveyInfo) || Boolean(user && surveyInfo?.template && surveyInfo.published)
const canExportSurvey = _hasSurveyPermission(Permission.recordAnalyse)
const canExportSurveysList = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const canViewTemplates = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
// UPDATE
const canEditSurvey = _hasSurveyPermission(Permission.surveyEdit)
const canEditSomeSurvey = _hasPermissionInSomeGroup(Permission.surveyEdit)
const canEditSurveyConfig = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const canEditSurveyOwner = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const canEditTemplates = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const canRefreshAllSurveyRdbs = (user: ArenaUser): boolean => Users.isSystemAdmin(user)

// ======
// ====== Record
// ======

// CREATE
export const canCreateRecord = _hasSurveyPermission(Permission.recordCreate)

// READ
export const canViewRecord = _hasSurveyPermission(Permission.recordView)
export const canExportAllRecords = _hasSurveyPermission(Permission.recordCleanse)
export const canViewNotOwnedRecords = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean => {
  if (!surveyInfo || !canViewSurvey(user, surveyInfo)) return false

  const { uuid: surveyUuid } = surveyInfo
  const groupInCurrentSurvey = Users.getAuthGroupBySurveyUuid(surveyUuid)(user)
  const groupName = groupInCurrentSurvey?.name

  if (groupName === AuthGroupName.dataEditor) {
    return Surveys.isDataEditorViewNotOwnedRecordsAllowed(surveyInfo)
  }
  if (groupName === AuthGroupName.dataAnalyst) {
    return Surveys.isDataAnalystViewNotOwnedRecordsAllowed(surveyInfo)
  }
  // survey guests can view (but not edit) all the records (restricted by user group qualifiers, if any)
  if (groupName === AuthGroupName.surveyGuest) return true
  if (canExportAllRecords(user, surveyInfo)) return true

  return false
}
export const canExportRecordsList = _hasSurveyPermission(Permission.recordAnalyse)

// UPDATE
export const canEditRecord = (user: ArenaUser, record: ArenaRecord, allowAnalysisStepEdit = false): boolean => {
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

  // groups without the record edit permission (e.g. survey guests) cannot edit records,
  // even when their record steps permission allows it (record steps permissions are used also to view records)
  if (!AuthGroups.getPermissions(userAuthGroup).includes(Permission.recordEdit)) return false

  // Level = 'all' or 'own'. If 'own', user can only edit records assigned to him
  // If 'all', he can edit all survey's records
  // permission checks must not throw: a group without record steps cannot edit records
  const level = AuthGroups.getRecordSteps(userAuthGroup)?.[Records.getStep(record)]
  return level === RecordStepPermission.all || (level === RecordStepPermission.own && ownerUuid === user.uuid)
}

// survey level: the user's role allows editing records (e.g. not survey guests); see canEditRecord for a specific record
const canEditRecords = _hasSurveyPermission(Permission.recordEdit)

const canChangeRecordProps = (user: ArenaUser, record: ArenaRecord) => canEditRecord(user, record, true)

const canDeleteRecord = canEditRecord

const canDemoteRecord = canChangeRecordProps

const canChangeRecordOwner = canChangeRecordProps

const canChangeRecordStep = canChangeRecordProps

const canCleanseRecords = _hasSurveyPermission(Permission.recordCleanse)

const canExportRecords = _hasSurveyPermission(Permission.recordView)

const canImportRecords = (user: ArenaUser, surveyInfo: ArenaSurvey) =>
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

const _usersBelongToSameSurvey = ({ user, userToView }: { user: ArenaUser; userToView: ArenaUser }) =>
  Users.getAuthGroups(user).some(
    (authGroupUser) =>
      AuthGroups.isSurveyGroup(authGroupUser) &&
      Users.getAuthGroups(userToView).some(
        (authGroupUserToView) =>
          AuthGroups.isSurveyGroup(authGroupUserToView) &&
          AuthGroups.getSurveyUuid(authGroupUserToView) === AuthGroups.getSurveyUuid(authGroupUser)
      )
  )

const canViewUser = (user: ArenaUser, _surveyInfo: ArenaSurvey, userToView: ArenaUser) =>
  Users.isSystemAdmin(user) || Users.isEqual(userToView)(user) || _usersBelongToSameSurvey({ user, userToView })

const canViewOtherUsersEmail = ({ user, surveyInfo }: { user: ArenaUser; surveyInfo: ArenaSurvey }) =>
  Users.isSystemAdmin(user) || canInviteUsers(user, surveyInfo)

const canViewOtherUsersNameInSameSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  _hasSurveyPermission(Permission.recordView)(user, surveyInfo)

const canViewAllUsers = (user: ArenaUser) => Users.isSystemAdmin(user)

// EDIT
const _hasUserEditAccess = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  Users.isSystemAdmin(user) ||
  (_hasSurveyPermission(Permission.userEdit)(user, surveyInfo) &&
    // user to update has an auth group in the same survey
    _hasAuthGroupForSurvey({ user: userToUpdate, surveyInfo }))

const canCreateUsers = (user: ArenaUser): boolean => Users.isSystemAdmin(user)

const canEditUser = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  Users.hasAccepted(userToUpdate) &&
  (Users.isEqual(user)(userToUpdate) || _hasUserEditAccess(user, surveyInfo, userToUpdate))

const canEditUserEmail = (user: ArenaUser): boolean => Users.isSystemAdmin(user)

const canEditUserGroup = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  !Users.isEqual(user)(userToUpdate) && _hasUserEditAccess(user, surveyInfo, userToUpdate)

const canRemoveUser = (user: ArenaUser, surveyInfo: ArenaSurvey, userToRemove: ArenaUser): boolean =>
  !Users.isEqual(user)(userToRemove) &&
  !Users.isSystemAdmin(userToRemove) &&
  _hasUserEditAccess(user, surveyInfo, userToRemove)

// only survey admins (and system admins) can manage the user groups of a survey
const canManageUserGroups = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean => {
  if (!user) return false
  if (Users.isSystemAdmin(user)) return true
  if (!surveyInfo) return false
  return _getSurveyUserGroup(user, surveyInfo)?.name === AuthGroupName.surveyAdmin
}

// qualifier attribute values are tied to user groups
const canEditQualifierAttributeValue = canManageUserGroups

const canEditUserAuthGroupExtraProps = (user: ArenaUser, surveyInfo: ArenaSurvey, userToUpdate: ArenaUser): boolean =>
  Users.isSystemAdmin(user) ||
  (canInviteUsers(user, surveyInfo) && _hasAuthGroupForSurvey({ user: userToUpdate, surveyInfo }))

const canEditUserSurveyManager = (user: ArenaUser) => Users.isSystemAdmin(user)
const canEditUserMaxSurveys = (user: ArenaUser) => Users.isSystemAdmin(user)

// USER ACCESS REQUESTS
const canViewUsersAccessRequests = (user: ArenaUser): boolean => Users.isSystemAdmin(user)
const canEditUsersAccessRequests = (user: ArenaUser): boolean => Users.isSystemAdmin(user)

// TWO-FACTOR AUTHENTICATION
const canManageUser2FADevices = (user: ArenaUser): boolean => Users.isSystemAdmin(user)

// INVITE
const getUserGroupsCanAssign = ({
  user,
  surveyInfo = null,
  showOnlySurveyGroups = false,
}: {
  user: ArenaUser
  surveyInfo?: ArenaSurvey | null
  showOnlySurveyGroups?: boolean
}) => {
  const groups = []

  let surveyGroups: ArenaAuthGroup[] = []
  if (surveyInfo) {
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
  canViewSurveyOrPublishedTemplate,
  canExportSurvey,
  canExportSurveysList,
  canViewTemplates,
  canEditSurvey,
  canEditSomeSurvey,
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
  canEditRecords,
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
  canManageUserGroups,
  canEditQualifierAttributeValue,
  canEditUserAuthGroupExtraProps,
  canEditUserSurveyManager,
  canEditUserMaxSurveys,
  // User Access Requests
  canViewUsersAccessRequests,
  canEditUsersAccessRequests,
  // Two-factor authentication
  canManageUser2FADevices,
  // Invite
  getUserGroupsCanAssign,
}
