import { Objects } from '../utils'

import { Message, MessagePropsKey, MessageStatus, MessageTarget } from './message'

const getStatus = (message: Message): MessageStatus => message.status

const getSubject = (message: Message): string | undefined => message.props?.subject

const getBody = (message: Message): string | undefined => message.props?.body

const getTargets = (message: Message): MessageTarget[] => message.props?.targets ?? []

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

export const Messages = {
  getStatus,
  getSubject,
  getBody,
  getTargets,
  assocStatus,
  assocSubject,
  assocBody,
  assocTargets,
}
