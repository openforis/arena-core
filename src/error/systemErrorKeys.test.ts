import { describe, expect, test } from '@jest/globals'

import { SystemErrorKeys } from './systemErrorKeys'

describe('SystemErrorKeys', () => {
  test('every key is a distinct non empty string', () => {
    const keys = Object.values(SystemErrorKeys).flatMap((group) => Object.values(group))
    expect(keys.every((key) => typeof key === 'string' && key.length > 0)).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
