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

// NOTE: these tests must pass in any time zone (CI runs them also in Asia/Tokyo and America/New_York)

describe('Dates.isValidDate', () => {
  test.each([
    [2024, 2, 29, true], // leap year
    [2023, 2, 29, false],
    [2000, 2, 29, true], // divisible by 400: leap year
    [1900, 2, 29, false], // divisible by 100 but not by 400: not a leap year
    [2020, 1, 31, true],
    [2020, 4, 31, false],
    [2020, 13, 1, false],
    [2020, 0, 1, false],
    ['2020', '12', '31', true], // string values
    ['', 1, 1, false],
    [2020, null, 1, false],
  ])('%s-%s-%s => %s', (year, month, day, expected) => {
    expect(Dates.isValidDate(year, month, day)).toBe(expected)
  })
})

describe('Dates.isValidDateInFormat', () => {
  test.each([
    ['2020-01-31', DateFormats.dateStorage, true],
    ['2020-02-30', DateFormats.dateStorage, false],
    ['2020-1-31', DateFormats.dateStorage, false], // strict format
    ['31/01/2020', DateFormats.dateDisplay, true],
    ['2020-01-31', DateFormats.dateDisplay, false],
    ['14:30', DateFormats.timeStorage, true],
    ['24:30', DateFormats.timeStorage, false],
    ['14:30:59', DateFormats.timeWithSeconds, true],
    ['not a date', DateFormats.dateStorage, false],
  ])('%s in format %s => %s', (dateStr, format, expected) => {
    expect(Dates.isValidDateInFormat(dateStr, format)).toBe(expected)
  })
})

describe('Dates.parse', () => {
  test('keeps the source digits as UTC by default (keepTimeZone)', () => {
    const date = Dates.parse('2020-01-31', DateFormats.dateStorage)
    expect(date?.toISOString()).toBe('2020-01-31T00:00:00.000Z')
    expect(Dates.formatUTC(date, DateFormats.dateStorage)).toBe('2020-01-31')
  })

  test('parses in the local time zone when keepTimeZone is false', () => {
    const date = Dates.parse('2020-01-31', DateFormats.dateStorage, { keepTimeZone: false })
    expect(Dates.format(date, DateFormats.dateStorage)).toBe('2020-01-31')
    expect(date?.getHours()).toBe(0)
  })

  test('returns undefined for an empty string', () => {
    expect(Dates.parse('', DateFormats.dateStorage)).toBeUndefined()
  })
})

describe('Dates.convertDate', () => {
  test.each([
    ['2020-01-31', DateFormats.dateStorage, DateFormats.dateDisplay, '31/01/2020'],
    ['31/01/2020', DateFormats.dateDisplay, DateFormats.dateStorage, '2020-01-31'],
    ['14:30', DateFormats.timeStorage, DateFormats.timeWithSeconds, '14:30:00'],
    ['14:30:45', DateFormats.timeWithSeconds, DateFormats.timeStorage, '14:30'],
    ['2020-01-31_23-59-58', DateFormats.datetimeDefault, DateFormats.dateStorage, '2020-01-31'],
  ])('%s (%s) => %s: %s', (dateStr, formatFrom, formatTo, expected) => {
    // the result must not depend on the time zone of the machine
    expect(Dates.convertDate({ dateStr, formatFrom, formatTo })).toBe(expected)
    expect(Dates.convertDate({ dateStr, formatFrom, formatTo, keepTimeZone: false })).toBe(expected)
  })

  test('returns undefined for empty or invalid values', () => {
    expect(Dates.convertDate({ dateStr: '', formatTo: DateFormats.dateDisplay })).toBeUndefined()
    expect(Dates.convertDate({ dateStr: 'abc', formatTo: DateFormats.dateDisplay })).toBeUndefined()
  })
})

describe('Dates add / sub / diff', () => {
  const date = new Date(Date.UTC(2024, 0, 31, 12, 0, 0))

  test('adds months clamping to the end of the month (leap year)', () => {
    const result = Dates.addMonths(date, 1)
    expect(result.getMonth()).toBe(1)
    expect([28, 29]).toContain(result.getDate())
    expect(Dates.addYears(new Date(2024, 1, 29), 1).getDate()).toBe(28)
  })

  test('add and sub are inverse operations for fixed length units', () => {
    expect(Dates.subSeconds(Dates.addSeconds(date, 90), 90).getTime()).toBe(date.getTime())
    expect(Dates.subMinutes(Dates.addMinutes(date, 90), 90).getTime()).toBe(date.getTime())
    expect(Dates.subHours(Dates.addHours(date, 30), 30).getTime()).toBe(date.getTime())
    expect(Dates.subWeeks(Dates.addWeeks(date, 3), 3).getTime()).toBe(date.getTime())
  })

  test('diff in different units', () => {
    const dateA = new Date(Date.UTC(2024, 2, 1, 0, 0, 0))
    const dateB = new Date(Date.UTC(2024, 1, 1, 0, 0, 0))
    expect(Dates.diffInHours(dateA, dateB)).toBe(29 * 24)
    expect(Dates.diffInMinutes(dateA, dateB)).toBe(29 * 24 * 60)
    expect(Dates.diffInSeconds(dateB, dateA)).toBe(-29 * 24 * 60 * 60)
  })

  test('diff in days counts calendar days in the local time zone (also across DST changes)', () => {
    // local dates: one of them is in summer time, the other one is not (in time zones with DST)
    const winterDate = new Date(2024, 0, 15, 12, 0, 0)
    const summerDate = new Date(2024, 6, 15, 12, 0, 0)
    expect(Dates.diffInDays(summerDate, winterDate)).toBe(182)
    expect(Dates.diffInMonths(summerDate, winterDate)).toBe(6)
    expect(Dates.diffInYears(Dates.addYears(winterDate, 2), winterDate)).toBe(2)
  })

  test('isAfter / isBefore accept dates, timestamps and ISO strings', () => {
    const earlier = '2024-01-01T00:00:00.000Z'
    const later = new Date(Date.UTC(2024, 0, 2))
    expect(Dates.isAfter(later, earlier)).toBe(true)
    expect(Dates.isBefore(earlier, later.getTime())).toBe(true)
    expect(Dates.isAfter(earlier, later)).toBe(false)
    expect(Dates.isAfter('', later)).toBe(false)
  })
})
