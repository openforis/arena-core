import { describe, expect, test } from '@jest/globals'

import { AuthGroupName, UserFactory } from '../auth'
import { Message, MessageNotificationType, MessageStatus, MessageTargetUserType } from './message'
import { Messages } from './messages'

const user = { ...UserFactory.createInstance({ email: 'user@arena.org', name: 'user' }), authGroups: [] }
const admin = {
  ...UserFactory.createInstance({ email: 'admin@arena.org', name: 'admin' }),
  authGroups: [{ name: AuthGroupName.systemAdmin }],
}

const createMessage = (props: Partial<NonNullable<Message['props']>> = {}): Message => ({
  uuid: 'message-uuid',
  status: MessageStatus.Sent,
  createdByUserUuid: 'creator-uuid',
  props: {
    targetAppIds: [],
    targetUserTypes: [MessageTargetUserType.All],
    notificationTypes: [MessageNotificationType.Email],
    ...props,
  },
})

const day = 24 * 60 * 60 * 1000

describe('Messages.isTargetingUser', () => {
  test('targets all users', () => {
    expect(Messages.isTargetingUser(user)(createMessage())).toBe(true)
  })

  test('targets only system administrators', () => {
    const message = createMessage({ targetUserTypes: [MessageTargetUserType.SystemAdmins] })
    expect(Messages.isTargetingUser(user)(message)).toBe(false)
    expect(Messages.isTargetingUser(admin)(message)).toBe(true)
  })

  test('expired message (date valid until in the past) does not target users, also when the date is a string', () => {
    const dateValidUntil = new Date(Date.now() - day)
    expect(Messages.isTargetingUser(user)(createMessage({ dateValidUntil }))).toBe(false)
    const dateValidUntilString = dateValidUntil.toISOString() as unknown as Date
    expect(Messages.isTargetingUser(user)(createMessage({ dateValidUntil: dateValidUntilString }))).toBe(false)
  })

  test('scheduled message (date scheduled in the future) does not target users yet, also when the date is a string', () => {
    const dateScheduledAt = new Date(Date.now() + day)
    expect(Messages.isTargetingUser(user)(createMessage({ dateScheduledAt }))).toBe(false)
    const dateScheduledAtString = dateScheduledAt.toISOString() as unknown as Date
    expect(Messages.isTargetingUser(user)(createMessage({ dateScheduledAt: dateScheduledAtString }))).toBe(false)
  })

  test('excluded user is not targeted', () => {
    const message = createMessage({ targetExcludedUserEmails: [user.email] })
    expect(Messages.isTargetingUser(user)(message)).toBe(false)
  })
})
