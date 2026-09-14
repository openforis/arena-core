import { describe, test, expect } from '@jest/globals'

import { LanguageCode } from '../language'
import { Numbers } from './numbers'

describe('Numbers.toWords', () => {
  test('converts to words in English by default', () => {
    expect(Numbers.toWords(1114)).toBe('one thousand one hundred fourteen')
  })

  test('converts to words in the specified supported language', () => {
    expect(Numbers.toWords(1114, LanguageCode.fr)).toBe('mille cent quatorze')
    expect(Numbers.toWords(1114, LanguageCode.es)).toBe('mil ciento catorce')
    expect(Numbers.toWords(1114, LanguageCode.ja)).toBe('千百十四')
    expect(Numbers.toWords(1114, LanguageCode.pt)).toBe('mil cento e catorze')
    expect(Numbers.toWords(1114, LanguageCode.ru)).toBe('одна тысяча сто четырнадцать')
  })

  test('falls back to English when the language is not supported', () => {
    // Mongolian (mn) is an Arena UI language, but n2words does not support it
    expect(Numbers.toWords(1114, LanguageCode.mn)).toBe('one thousand one hundred fourteen')
    expect(Numbers.toWords(1114, LanguageCode.zh)).toBe('one thousand one hundred fourteen')
  })

  test('returns null for empty or non-numeric values', () => {
    expect(Numbers.toWords(null)).toBeNull()
    expect(Numbers.toWords(undefined)).toBeNull()
    expect(Numbers.toWords('')).toBeNull()
    expect(Numbers.toWords('not a number')).toBeNull()
  })
})
