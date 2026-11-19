import { AuthGroupName, ArenaUser, Users, UserTitle } from '../auth'
import type { ArenaI18n } from '../common'
import { Objects } from '../utils'

import { ArenaMessage, MessageNotificationType, MessagePropsKey, MessageStatus, MessageTargetUserType } from './message'

const hiddenProps = [
  MessagePropsKey.targetUserEmails,
  MessagePropsKey.targetUserUuids,
  MessagePropsKey.targetExcludedUserEmails,
]

const getStatus = (message: ArenaMessage): MessageStatus => message.status

const getDateCreated = (message: ArenaMessage): Date | undefined => message.dateCreated

const getDateModified = (message: ArenaMessage): Date | undefined => message.dateModified

const getDateValidUntil = (message: ArenaMessage): Date | undefined => message.props?.dateValidUntil

const getDateScheduledAt = (message: ArenaMessage): Date | undefined => message.props?.dateScheduledAt

const getNotificationTypes = (message: ArenaMessage): MessageNotificationType[] =>
  message.props?.notificationTypes ?? []

const getSubject = (message: ArenaMessage): string | undefined => message.props?.subject

const getBody = (message: ArenaMessage): string | undefined => message.props?.body

const getTargetAppIds = (message: ArenaMessage): string[] => message.props?.targetAppIds ?? []

const getTargetUserTypes = (message: ArenaMessage): MessageTargetUserType[] => message.props?.targetUserTypes ?? []

const getTargetUserEmails = (message: ArenaMessage): string[] => message.props?.targetUserEmails ?? []

const getTargetExcludedUserEmails = (message: ArenaMessage): string[] => message.props?.targetExcludedUserEmails ?? []

const assocStatus =
  (status: MessageStatus) =>
  (message: ArenaMessage): ArenaMessage =>
    Objects.assoc({ obj: message, prop: 'status', value: status })

const assocProp =
  (propKey: MessagePropsKey, propValue: any) =>
  (message: ArenaMessage): ArenaMessage =>
    Objects.assocPath({ obj: message, path: ['props', propKey], value: propValue })

const assocSubject =
  (subject: string) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.subject, subject)(message)

const assocBody =
  (body: string) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.body, body)(message)

const assocNotificationTypes =
  (notificationTypes: MessageNotificationType[]) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.notificationTypes, notificationTypes)(message)

const assocTargetAppIds =
  (targetAppIds: string[]) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.targetAppIds, targetAppIds)(message)

const assocTargetUserTypes =
  (targetUserTypes: MessageTargetUserType[]) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.targetUserTypes, targetUserTypes)(message)

const assocTargetUserEmails =
  (emails: string[]) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.targetUserEmails, emails)(message)

const assocTargetExcludedUserEmails =
  (emails: string[]) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.targetExcludedUserEmails, emails)(message)

const assocDateValidUntil =
  (dateValidUntil: Date | undefined) =>
  (message: ArenaMessage): ArenaMessage =>
    assocProp(MessagePropsKey.dateValidUntil, dateValidUntil)(message)

const isTargetingUser =
  (user: ArenaUser) =>
  (message: ArenaMessage): boolean => {
    const now = Date.now()
    // dates can be strings (e.g. when the message comes from JSON): compare timestamps
    const validUntil = getDateValidUntil(message)
    if (validUntil && new Date(validUntil).getTime() < now) {
      return false
    }
    const scheduledAt = getDateScheduledAt(message)
    if (scheduledAt && new Date(scheduledAt).getTime() > now) {
      return false
    }
    const targets = getTargetUserTypes(message)
    if (targets.includes(MessageTargetUserType.Individual)) {
      return getTargetUserEmails(message).includes(user.email)
    }
    if (getTargetExcludedUserEmails(message).includes(user.email)) {
      return false
    }
    return (
      targets.includes(MessageTargetUserType.All) ||
      (targets.includes(MessageTargetUserType.SystemAdmins) && Users.isSystemAdmin(user)) ||
      (targets.includes(MessageTargetUserType.SurveyAdmins) &&
        !!Users.getAuthGroupByName(AuthGroupName.surveyAdmin)(user)) ||
      (targets.includes(MessageTargetUserType.SurveyManagers) && Users.isSurveyManager(user)) ||
      (targets.includes(MessageTargetUserType.DataAnalysts) &&
        !!Users.getAuthGroupByName(AuthGroupName.dataAnalyst)(user)) ||
      (targets.includes(MessageTargetUserType.DataCleaners) &&
        !!Users.getAuthGroupByName(AuthGroupName.dataCleanser)(user)) ||
      (targets.includes(MessageTargetUserType.DataEditors) &&
        !!Users.getAuthGroupByName(AuthGroupName.dataEditor)(user))
    )
  }

const clearHiddenProps = (message: ArenaMessage): ArenaMessage => {
  return hiddenProps.reduce((msg, prop) => assocProp(prop, undefined)(msg), message)
}

const clearNotApplicableProps = (message: ArenaMessage): ArenaMessage => {
  const targets = getTargetUserTypes(message)
  let messageNext = message
  const targetEmailsNext = targets.includes(MessageTargetUserType.Individual) ? getTargetUserEmails(message) : []
  messageNext = assocTargetUserEmails(targetEmailsNext)(messageNext)
  const excludedEmailsNext = targets.includes(MessageTargetUserType.Individual)
    ? []
    : getTargetExcludedUserEmails(message)
  messageNext = assocTargetExcludedUserEmails(excludedEmailsNext)(messageNext)
  return messageNext
}

const replaceBodyTemplateVariables =
  ({ i18n, user }: { i18n: ArenaI18n; user: ArenaUser }) =>
  (message: ArenaMessage): ArenaMessage => {
    const body = getBody(message) ?? ''
    const titleKey = user.props?.title
    const name = user.name
    const titleAndNameParts = []
    if (Objects.isNotEmpty(name)) {
      titleAndNameParts.push(name)
    }
    if (Objects.isNotEmpty(titleKey) && UserTitle.preferNotToSay !== titleKey) {
      const title = i18n.t(`user.titleValues.${titleKey}`)
      titleAndNameParts.unshift(title)
    }
    const userTitleAndName = titleAndNameParts.length > 0 ? titleAndNameParts.join(' ') : 'User'
    const bodyFixed = body
      .replaceAll('{{userTitleAndName}}', userTitleAndName)
      .replaceAll('{{userName}}', name ?? 'User')
    return assocBody(bodyFixed)(message)
  }

export const Messages = {
  getStatus,
  getDateCreated,
  getDateModified,
  getDateScheduledAt,
  getDateValidUntil,
  getNotificationTypes,
  getSubject,
  getBody,
  getTargetAppIds,
  getTargetUserTypes,
  getTargetUserEmails,
  getTargetExcludedUserEmails,
  assocStatus,
  assocSubject,
  assocBody,
  assocNotificationTypes,
  assocTargetAppIds,
  assocTargetUserTypes,
  assocTargetUserEmails,
  assocTargetExcludedUserEmails,
  assocDateValidUntil,
  isTargetingUser,
  clearHiddenProps,
  clearNotApplicableProps,
  replaceBodyTemplateVariables,
}
