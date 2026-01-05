import { AuthGroupName, User, Users, UserTitle } from '../auth'
import { Objects } from '../utils'

import { Message, MessageNotificationType, MessagePropsKey, MessageStatus, MessageTargetUserType } from './message'

const getStatus = (message: Message): MessageStatus => message.status

const getDateValidUntil = (message: Message): Date | undefined => message.props?.dateValidUntil

const getDateScheduledAt = (message: Message): Date | undefined => message.props?.dateScheduledAt

const getNotificationTypes = (message: Message): MessageNotificationType[] => message.props?.notificationTypes ?? []

const getSubject = (message: Message): string | undefined => message.props?.subject

const getBody = (message: Message): string | undefined => message.props?.body

const getTargetAppIds = (message: Message): string[] => message.props?.targetAppIds ?? []

const getTargetUserTypes = (message: Message): MessageTargetUserType[] => message.props?.targetUserTypes ?? []

const getTargetUserEmails = (message: Message): string[] => message.props?.targetUserEmails ?? []

const getTargetExcludedUserEmails = (message: Message): string[] => message.props?.targetExcludedUserEmails ?? []

const assocStatus =
  (status: MessageStatus) =>
  (message: Message): Message =>
    Objects.assoc({ obj: message, prop: 'status', value: status })

const assocProp =
  (propKey: MessagePropsKey, propValue: any) =>
  (message: Message): Message =>
    Objects.assocPath({ obj: message, path: ['props', propKey], value: propValue })

const assocSubject =
  (subject: string) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.subject, subject)(message)

const assocBody =
  (body: string) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.body, body)(message)

const assocNotificationTypes =
  (notificationTypes: MessageNotificationType[]) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.notificationTypes, notificationTypes)(message)

const assocTargetAppIds =
  (targetAppIds: string[]) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.targetAppIds, targetAppIds)(message)

const assocTargetUserTypes =
  (targetUserTypes: MessageTargetUserType[]) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.targetUserTypes, targetUserTypes)(message)

const assocTargetUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.targetUserEmails, emails)(message)

const assocTargetExcludedUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assocProp(MessagePropsKey.targetExcludedUserEmails, emails)(message)

const isTargetingUser =
  (user: User) =>
  (message: Message): boolean => {
    const validUntil = getDateValidUntil(message)
    if (validUntil && validUntil < new Date()) {
      return false
    }
    const scheduledAt = getDateScheduledAt(message)
    if (scheduledAt && scheduledAt > new Date()) {
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

const clearHiddenProps = (message: Message): Message => {
  const hiddenProps = [
    MessagePropsKey.targetUserEmails,
    MessagePropsKey.targetUserUuids,
    MessagePropsKey.targetExcludedUserEmails,
  ]
  let messageUpdated = structuredClone(message)
  for (const prop of hiddenProps) {
    messageUpdated = assocProp(prop, undefined)(messageUpdated)
  }
  return messageUpdated
}

const replaceBodyTemplateVariables =
  ({ i18n, user }: { i18n: any; user: User }) =>
  (message: Message): Message => {
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
  isTargetingUser,
  clearHiddenProps,
  replaceBodyTemplateVariables,
}
