import { AuthGroup, AuthGroupMethods, StepKeys } from './authGroup'

import { Survey } from '../survey'
import { User, UserMethods } from './user'
import { Permission } from './permission'
import { Record, RecordMethods } from '../record'

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user: User, survey: Survey, includeSystemAdmin = true): AuthGroup | undefined =>
  UserMethods.getAuthGroupBySurveyUuid(survey.uuid, includeSystemAdmin)(user)

const _hasSurveyPermission = (permission: Permission) => (user: User, survey: Survey) =>
  user &&
  survey &&
  (UserMethods.isSystemAdmin(user) || _getSurveyUserGroup(user, survey)?.permissions.includes(permission))

// READ
const canViewSurvey = (user: User, survey: Survey): boolean => Boolean(_getSurveyUserGroup(user, survey))

// UPDATE
const canEditSurvey = _hasSurveyPermission(Permission.surveyEdit)

// ======
// ====== Record
// ======

// CREATE
const canCreateRecord = _hasSurveyPermission(Permission.recordCreate)

// READ
const canViewRecord = _hasSurveyPermission(Permission.recordView)

// UPDATE
const canEditRecord = (user: User, record: Record): boolean => {
  if (UserMethods.isSystemAdmin(user)) {
    return true
  }

  if (!(user && record)) {
    return false
  }

  const { step: recordDataStep, surveyUuid: recordSurveyUuid } = record

  const userAuthGroup = UserMethods.getAuthGroupBySurveyUuid(recordSurveyUuid)(user)

  // Level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = AuthGroupMethods.getRecordEditLevel(recordDataStep)(userAuthGroup)

  return (
    level === StepKeys.all ||
    (level === StepKeys.own && RecordMethods.getOwnerUuid(record) === UserMethods.getUuid(user))
  )
}

const canCleanseRecords = _hasSurveyPermission(Permission.recordCleanse)

const canAnalyzeRecords = _hasSurveyPermission(Permission.recordAnalyse)

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = _hasSurveyPermission(Permission.userInvite)

// READ
const canViewUser = (user: User, survey: Survey, userToView: User): boolean =>
  UserMethods.isSystemAdmin(user) ||
  (Boolean(_getSurveyUserGroup(user, survey, false)) && Boolean(_getSurveyUserGroup(userToView, survey, false)))

// EDIT
const _hasUserEditAccess = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(
    UserMethods.isSystemAdmin(user) ||
      (_hasSurveyPermission(Permission.userEdit)(user, survey) &&
        Boolean(_getSurveyUserGroup(userToUpdate, survey, false)))
  )

export const canEditUser = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(
    UserMethods.hasAccepted(userToUpdate) &&
      (UserMethods.isEqual(user)(userToUpdate) || _hasUserEditAccess(user, survey, userToUpdate))
  )

export const canEditUserEmail = _hasUserEditAccess

export const canEditUserGroup = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(!UserMethods.isEqual(user)(userToUpdate) && _hasUserEditAccess(user, survey, userToUpdate))

export const canRemoveUser = (user: User, survey: Survey, userToRemove: User): boolean =>
  Boolean(
    !UserMethods.isEqual(user)(userToRemove) &&
      !UserMethods.isSystemAdmin(userToRemove) &&
      _hasUserEditAccess(user, survey, userToRemove)
  )

export const Authorizer = {
  //Survey
  // READ
  canViewSurvey,
  // UPDATE
  canEditSurvey,
  //Record
  // CREATE
  canCreateRecord,
  // READ
  canViewRecord,
  // UPDATE
  canEditRecord,
  canCleanseRecords,
  canAnalyzeRecords,
  //Users
  // CREATE
  canInviteUsers,
  // READ
  canViewUser,
  // EDIT
  canEditUser,
  canEditUserEmail,
  canEditUserGroup,
  canRemoveUser,
}
