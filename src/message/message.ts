export enum MessageStatus {
  Draft = 'draft',
  Sent = 'sent',
  Archived = 'archived',
}

export enum MessageTargetUsers {
  All = 'all',
  SystemAdmins = 'system_admins',
  SurveyManagers = 'survey_managers',
  DataEditors = 'data_editors',
  Individual = 'individual',
}

export enum MessageNotificationType {
  Email = 'email',
  PushNotification = 'push_notification',
}

export enum MessagePropsKey {
  subject = 'subject',
  body = 'body',
  targetAppIds = 'targetAppIds',
  targetUsers = 'targetUsers',
  targetUserUuids = 'targetUserUuids',
  targetExcludedUserEmails = 'targetExcludedUserEmails',
  notificationTypes = 'notificationTypes',
  scheduledDate = 'scheduledDate',
  validUntil = 'validUntil',
}

export type MessageProps = {
  [MessagePropsKey.subject]?: string
  [MessagePropsKey.body]?: string
  [MessagePropsKey.targetAppIds]: string[]
  [MessagePropsKey.targetUsers]: MessageTargetUsers[]
  [MessagePropsKey.targetUserUuids]?: string[]
  [MessagePropsKey.targetExcludedUserEmails]?: string[]
  [MessagePropsKey.notificationTypes]: MessageNotificationType[]
  [MessagePropsKey.scheduledDate]?: Date
  [MessagePropsKey.validUntil]?: Date
}

/**
 * Represents a message record in the database.
 */
export type Message = {
  uuid: string
  status: MessageStatus
  props?: MessageProps
  createdByUserUuid: string
  dateCreated?: Date
  dateModified?: Date
}
