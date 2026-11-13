import { describe, test, expect } from '@jest/globals'

import { isUnsafeRegExpSource } from './regExpSafety'

describe('isUnsafeRegExpSource', () => {
  test.each([
    // nested quantifiers
    '^(a+)+$',
    '(\\w*)*',
    '(x{1,3})+',
    '((ab)+c)*',
    '(?:a+)+',
    '(a+){2,}',
    '([a-z]+\\s?)+$',
    // repetitions with a high maximum
    '(a+){1,1000}',
    '(?:\\w*){2,10}',
    // overlapping alternatives
    '^(a|aa)+$',
    '(?:a|aa)*',
    '(a|.)+',
    '(\\d|-)+',
    '(a|[ab])+',
    '(ab|ac)+',
    '(A|a)+',
    '(a?b|b)+',
    '(a|)+',
    '(|a)+',
    '(a|aa){2,}',
    '(a|aa){1,100}',
    '(?<name>a|aa)+',
    // overlapping alternatives in a nested group
    '((a|aa))+',
    '(?:x(a|aa))*',
    '((?:a|aa)b)+',
  ])('unsafe: %s', (source) => {
    expect(isUnsafeRegExpSource(source)).toBe(true)
  })

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
    // alternatives starting with different literal characters
    '^(a|b)+$',
    '(ab|cd|ef)*',
    '(?:\\.|-|_)+',
    '(a(b|c)|d)+',
    '(x|y){1,3}',
    '(?<name>a|b)+',
    // overlapping alternatives not repeated
    '^(a|aa)$',
    '(a|aa){1,3}',
    'a|aa',
    '^(?:yes|no|y|n)$',
    '(a|.)?',
  ])('safe: %s', (source) => {
    expect(isUnsafeRegExpSource(source)).toBe(false)
  })
})
