import { AuthGroup } from './authGroup'
import { AuthGroups } from './authGroups'

import { Survey } from '../survey'
import { User, UserStatus } from './user'
import { Users } from './users'
import { Permission, RecordStepPermission } from './permission'
import { Record } from '../record'

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user: User, survey: Survey, includeSystemAdmin = true): AuthGroup | undefined =>
  Users.getAuthGroupBySurveyUuid(survey.uuid, includeSystemAdmin)(user)

const _hasSurveyPermission = (permission: Permission) => (user: User, survey: Survey) =>
  user && survey && (Users.isSystemAdmin(user) || _getSurveyUserGroup(user, survey)?.permissions.includes(permission))

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
  if (Users.isSystemAdmin(user)) {
    return true
  }

  if (!(user && record)) {
    return false
  }

  const { step: recordDataStep, surveyUuid: recordSurveyUuid } = record

  const userAuthGroup = Users.getAuthGroupBySurveyUuid(recordSurveyUuid)(user)

  // Level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = AuthGroups.getRecordEditLevel(recordDataStep)(userAuthGroup)

  return level === RecordStepPermission.all || (level === RecordStepPermission.own && record.ownerUuid === user.uuid)
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
  Users.isSystemAdmin(user) ||
  Boolean(_getSurveyUserGroup(user, survey, false) && _getSurveyUserGroup(userToView, survey, false))

// EDIT
const _hasUserEditAccess = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(
    Users.isSystemAdmin(user) ||
      (_hasSurveyPermission(Permission.userEdit)(user, survey) && _getSurveyUserGroup(userToUpdate, survey, false))
  )

export const canEditUser = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(
    userToUpdate.status === UserStatus.ACCEPTED &&
      (user.uuid === userToUpdate.uuid || _hasUserEditAccess(user, survey, userToUpdate))
  )

export const canEditUserEmail = _hasUserEditAccess

export const canEditUserGroup = (user: User, survey: Survey, userToUpdate: User): boolean =>
  Boolean(!(user.uuid === userToUpdate.uuid) && _hasUserEditAccess(user, survey, userToUpdate))

export const canRemoveUser = (user: User, survey: Survey, userToRemove: User): boolean =>
  Boolean(
    !(user.uuid === userToRemove.uuid) &&
      !Users.isSystemAdmin(userToRemove) &&
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
