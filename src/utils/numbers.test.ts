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

describe('Numbers.formatDecimal', () => {
  test('no decimal digits: plain notation, no rounding', () => {
    expect(Numbers.formatDecimal(0.0000001)).toBe('0.0000001')
    expect(Numbers.formatDecimal(-0.0000001)).toBe('-0.0000001')
    expect(Numbers.formatDecimal(1e21)).toBe('1000000000000000000000')
    expect(Numbers.formatDecimal(123.456)).toBe('123.456')
    expect(Numbers.formatDecimal(1234567.5)).toBe('1234567.5')
  })

  test('decimal digits', () => {
    expect(Numbers.formatDecimal(1234.5678, 2)).toBe('1,234.57')
    expect(Numbers.formatDecimal(1234.5678, 0)).toBe('1235')
  })

  test('null or NaN: null', () => {
    expect(Numbers.formatDecimal(null as unknown as number)).toBeNull()
    expect(Numbers.formatDecimal(Number.NaN)).toBeNull()
  })
})

describe('Numbers.limit', () => {
  test('0 is a valid bound', () => {
    expect(Numbers.limit({ minValue: 0 })(-5)).toBe(0)
    expect(Numbers.limit({ maxValue: 0 })(5)).toBe(0)
    expect(Numbers.limit({ minValue: 0, maxValue: 10 })(5)).toBe(5)
  })

  test('no bounds: value unchanged', () => {
    expect(Numbers.limit({})(-5)).toBe(-5)
  })
})

describe('Numbers.roundToPrecision', () => {
  test.each([
    [1.005, 2, 1.01],
    [2.345, 2, 2.35],
    [-2.5, 0, -3],
    [33.333333, 2, 33.33],
    [1250, -2, 1300],
    [1.5, Number.NaN, 1.5],
  ])('roundToPrecision(%s, %s) = %s', (value, precision, expected) => {
    expect(Numbers.roundToPrecision(value, precision)).toBe(expected)
  })

  test('empty value: NaN', () => {
    expect(Numbers.roundToPrecision(null, 2)).toBeNaN()
  })
})
