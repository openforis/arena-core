import { describe, expect, test } from '@jest/globals'

import { AppInfos } from './appInfos'

describe('AppInfos', () => {
  test.each([
    { appId: 'arena', expected: 'Arena' },
    { appId: 'am', expected: 'Arena Mobile' },
    { appId: 'arena-mobile', expected: 'Arena Mobile' },
    { appId: 'other-app', expected: 'other-app' },
  ])('getAppIdLabel($appId)', ({ appId, expected }) => {
    expect(AppInfos.getAppIdLabel(appId)).toBe(expected)
  })

  test('getLabel', () => {
    expect(AppInfos.getLabel({ appId: 'am', version: '1.0.0' })).toBe('Arena Mobile')
    expect(AppInfos.getLabel(undefined)).toBeUndefined()
  })
})
