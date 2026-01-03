import { AuthGroupName, User, Users } from '../auth'
import { Objects } from '../utils'

import { Message, MessageNotificationType, MessagePropsKey, MessageStatus, MessageTargetUserType } from './message'

const getStatus = (message: Message): MessageStatus => message.status

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

const assoProp =
  (propKey: MessagePropsKey, propValue: any) =>
  (message: Message): Message =>
    Objects.assocPath({ obj: message, path: ['props', propKey], value: propValue })

const assocSubject =
  (subject: string) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.subject, subject)(message)

const assocBody =
  (body: string) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.body, body)(message)

const assocTargetAppIds =
  (targetAppIds: string[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetAppIds, targetAppIds)(message)

const assocTargetUserTypes =
  (targetUserTypes: MessageTargetUserType[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetUserTypes, targetUserTypes)(message)

const assocTargetUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetUserEmails, emails)(message)

const assocTargetExcludedUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetExcludedUserEmails, emails)(message)

const isTargetingUser =
  (user: User) =>
  (message: Message): boolean => {
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
      (targets.includes(MessageTargetUserType.DataEditors) &&
        !!Users.getAuthGroupByName(AuthGroupName.dataEditor)(user))
    )
  }

export const Messages = {
  getStatus,
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
  assocTargetAppIds,
  assocTargetUserTypes,
  assocTargetUserEmails,
  assocTargetExcludedUserEmails,
  isTargetingUser,
}
