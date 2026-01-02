import { Objects } from '../utils'

import { Message, MessageNotificationType, MessagePropsKey, MessageStatus, MessageTarget } from './message'

const getStatus = (message: Message): MessageStatus => message.status

const getNotificationTypes = (message: Message): MessageNotificationType[] => message.props?.notificationTypes ?? []

const getSubject = (message: Message): string | undefined => message.props?.subject

const getBody = (message: Message): string | undefined => message.props?.body

const getTargets = (message: Message): MessageTarget[] => message.props?.targets ?? []

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

const assocTargets =
  (targets: MessageTarget[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targets, targets)(message)

const assocTargetExcludedUserEmails =
  (emails: string[]) =>
  (message: Message): Message =>
    assoProp(MessagePropsKey.targetExcludedUserEmails, emails)(message)

export const Messages = {
  getStatus,
  getNotificationTypes,
  getSubject,
  getBody,
  getTargets,
  getTargetExcludedUserEmails,
  assocStatus,
  assocSubject,
  assocBody,
  assocTargets,
  assocTargetExcludedUserEmails,
}
