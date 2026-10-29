import { describe, test, expect } from '@jest/globals'

import { hasNestedQuantifiers } from './regExpSafety'

describe('hasNestedQuantifiers', () => {
  test.each(['^(a+)+$', '(\\w*)*', '(x{1,3})+', '((ab)+c)*', '(?:a+)+', '(a+){2,}', '([a-z]+\\s?)+$'])(
    'unsafe: %s',
    (source) => {
      expect(hasNestedQuantifiers(source)).toBe(true)
    }
  )

  test.each([
    '^\\w+$',
    '^[a-z\\s]{3,50}$',
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    '(\\d+\\.){3}\\d+',
    '(ab)+',
    '([a-z]{2})+',
    '(\\+)+',
    '([+*])+',
    '(a+){1,3}',
    '(?:abc)?',
  ])('safe: %s', (source) => {
    expect(hasNestedQuantifiers(source)).toBe(false)
  })
})
