import { describe, test, expect } from '@jest/globals'

import { DateFormats, Dates } from './dates'

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

describe('Dates datetimeStorage format', () => {
  test('formats a date as ISO string', () => {
    const date = new Date(Date.UTC(2020, 0, 1, 10, 20, 30, 400))
    expect(Dates.formatUTC(date, DateFormats.datetimeStorage)).toBe('2020-01-01T10:20:30.400Z')
  })

  // the date must not depend on the time zone of the machine (run the tests with e.g. TZ=Asia/Tokyo to verify it)
  test('date only string is parsed as UTC (not shifted by the local time zone)', () => {
    const date = Dates.parse('2020-01-01', DateFormats.datetimeStorage)
    expect(date?.toISOString()).toBe('2020-01-01T00:00:00.000Z')
    expect(Dates.formatUTC(date, DateFormats.dateStorage)).toBe('2020-01-01')
  })

  test('ISO string with time zone offset is parsed correctly', () => {
    const date = Dates.parse('2020-01-01T10:00:00.000+02:00', DateFormats.datetimeStorage)
    expect(date?.toISOString()).toBe('2020-01-01T08:00:00.000Z')
  })
})
