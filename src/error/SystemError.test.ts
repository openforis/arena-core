import { describe, expect, test } from '@jest/globals'

import { SystemError } from './SystemError'

describe('SystemError', () => {
  test('exposes key and params', () => {
    const error = new SystemError('my.key', { name: 'value' })
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('SystemError')
    expect(error.message).toBe('my.key')
    expect(error.key).toBe('my.key')
    expect(error.params).toEqual({ name: 'value' })
    expect(error.cause).toBeUndefined()
  })

  test('keeps the original error as cause', () => {
    const cause = new Error('original error')
    const error = new SystemError('my.key', {}, { cause })
    expect(error.cause).toBe(cause)
    // the cause is not part of the JSON sent to the clients
    expect(error.toJSON()).toEqual({ key: 'my.key', params: {} })
  })
})
