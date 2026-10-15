import { describe, test, expect } from '@jest/globals'

import { getLabelOrDefault } from './labels'
import { LanguageCode } from './languageCode'

describe('getLabelOrDefault', () => {
  const labels = { en: 'Tree', fr: '' }

  test('returns the label in the specified language', () => {
    expect(getLabelOrDefault(labels, LanguageCode.en, 'tree')).toBe('Tree')
  })

  test('returns the default value when the label is missing or empty', () => {
    expect(getLabelOrDefault(labels, LanguageCode.fr, 'tree')).toBe('tree')
    expect(getLabelOrDefault(labels, LanguageCode.es, 'tree')).toBe('tree')
    expect(getLabelOrDefault(undefined, LanguageCode.en, 'tree')).toBe('tree')
    expect(getLabelOrDefault(labels, undefined, 'tree')).toBe('tree')
  })

  test('returns an empty string by default', () => {
    expect(getLabelOrDefault(labels, LanguageCode.fr)).toBe('')
  })
})
