import { describe, test, expect } from '@jest/globals'

import { Dates } from './dates'

describe('Dates.isValidTime', () => {
  test('is true for a valid hour/minute with no seconds argument', () => {
    expect(Dates.isValidTime(14, 30)).toBe(true)
  })

  test('is false for an out-of-range hour or minute', () => {
    expect(Dates.isValidTime(24, 30)).toBe(false)
    expect(Dates.isValidTime(14, 60)).toBe(false)
  })

  test('is true for a valid hour/minute/seconds triple', () => {
    expect(Dates.isValidTime(14, 30, 45)).toBe(true)
  })

  test('is false for an out-of-range seconds value', () => {
    expect(Dates.isValidTime(14, 30, 60)).toBe(false)
    expect(Dates.isValidTime(14, 30, -1)).toBe(false)
  })
})
