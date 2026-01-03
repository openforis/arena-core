import { AuthGroupName, User, Users } from '../auth'
import { Objects } from '../utils'

import { Message, MessageNotificationType, MessagePropsKey, MessageStatus, MessageTargetUsers } from './message'

const getStatus = (message: Message): MessageStatus => message.status

const getNotificationTypes = (message: Message): MessageNotificationType[] => message.props?.notificationTypes ?? []

const getSubject = (message: Message): string | undefined => message.props?.subject

const getBody = (message: Message): string | undefined => message.props?.body

const getTargetAppIds = (message: Message): string[] => message.props?.targetAppIds ?? []

const getTargetUsers = (message: Message): MessageTargetUsers[] => message.props?.targetUsers ?? []

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

const assocTargetUsers =
  (targetUsers: MessageTargetUsers[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetUsers, targetUsers)(message)

const assocTargetExcludedUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetExcludedUserEmails, emails)(message)

const isMessageTargetingUser =
  (user: User) =>
  (message: Message): boolean => {
    const targets = getTargetUsers(message)
    return (
      !getTargetExcludedUserEmails(message).includes(user.email) &&
      ((targets.includes(MessageTargetUsers.SystemAdmins) && Users.isSystemAdmin(user)) ||
        (targets.includes(MessageTargetUsers.SurveyAdmins) &&
          !!Users.getAuthGroupByName(AuthGroupName.surveyAdmin)(user)) ||
        (targets.includes(MessageTargetUsers.SurveyManagers) && Users.isSurveyManager(user)) ||
        (targets.includes(MessageTargetUsers.DataEditors) &&
          !!Users.getAuthGroupByName(AuthGroupName.dataEditor)(user)))
    )
  }

export const Messages = {
  getStatus,
  getNotificationTypes,
  getSubject,
  getBody,
  getTargetAppIds,
  getTargetUsers,
  getTargetExcludedUserEmails,
  assocStatus,
  assocSubject,
  assocBody,
  assocTargetAppIds,
  assocTargetUsers,
  assocTargetExcludedUserEmails,
  isMessageTargetingUser,
}
