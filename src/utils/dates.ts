import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { Objects } from './_objects'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export enum DateFormats {
  dateDisplay = 'DD/MM/YYYY',
  dateStorage = 'YYYY-MM-DD',
  datetimeDisplay = 'DD/MM/YYYY HH:mm:ss',
  datetimeStorage = 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', // ISO
  timeStorage = 'HH:mm',
  timeWithSeconds = 'HH:mm:ss',
  datetimeDefault = 'YYYY-MM-DD_HH-mm-ss',
}

export enum UnitOfTime {
  years = 'years',
  months = 'months',
  weeks = 'weeks',
  days = 'days',
  hours = 'hours',
  minutes = 'minutes',
  seconds = 'seconds',
}

type DateType = Date | number | string

const format = (date: number | Date | undefined, format: string): string => (date ? dayjs(date).format(format) : '')

/**
 * Like `format`, but renders in UTC instead of the machine's local time zone.
 * Use this when formatting a `Date` produced by `parse`/`parseZone`-style parsing, whose
 * underlying timestamp already encodes the source digits as if they were UTC (see `parse`) -
 * formatting with the local-time `format` above would silently re-shift them by the host's offset.
 */
const formatUTC = (date: number | Date | undefined, format: string): string =>
  date ? dayjs.utc(date).format(format) : ''

const formatForStorage = (date: DateType): string => new Date(date).toISOString()
const formatForExpression = (date: DateType): string => format(new Date(date), DateFormats.datetimeDefault)

const nowFormattedForStorage = (): string => formatForStorage(new Date())
const nowFormattedForExpression = (): string => formatForExpression(Date.now())

// ISO date or date time: YYYY-MM-DD[THH:mm[:ss[.SSS]]][Z|±HH:mm]
const ISO_DATE_TIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/

/**
 * Parses an ISO date (or date time) string; values like 2020-02-30 are not valid (they are not moved to the next month).
 * Date only strings and date times without offset are read as UTC.
 */
const parseISOStrict = (dateStr: string): Date => {
  const match = ISO_DATE_TIME_REGEX.exec(dateStr)
  if (!match) return new Date(Number.NaN)
  const [, year, month, day, hours, minutes, seconds] = match
  if (!isValidDate(year, month, day)) return new Date(Number.NaN)
  if (hours !== undefined && !isValidTime(hours, minutes, seconds ?? 0)) return new Date(Number.NaN)
  return dayjs.utc(dateStr).toDate()
}

const parseISO = (dateStr: string): Date | undefined => (dateStr ? dayjs(dateStr).toDate() : undefined)
const parse = (
  dateStr: string,
  format: DateFormats,
  { keepTimeZone = true, strict = false } = {}
): Date | undefined => {
  if (!dateStr) return undefined
  // ISO strings without an explicit offset (e.g. date only) are read as UTC, like the other formats with keepTimeZone
  if (format == DateFormats.datetimeStorage) return parseISOStrict(dateStr)
  // keepTimeZone: the formats don't contain any time zone offset, so the digits are read as UTC
  if (keepTimeZone) return dayjs.utc(dateStr, format, strict).toDate()
  return dayjs(dateStr, format, strict).toDate()
}

const isValidDateObject = (date: Date | undefined): boolean => !!date && dayjs(date).isValid()

const isValidDateInFormat = (dateStr: string, format: DateFormats) => {
  const parsed = parse(dateStr, format, { strict: true })
  return isValidDateObject(parsed)
}

const convertDate = (params: {
  dateStr: string
  formatFrom?: DateFormats
  formatTo: DateFormats
  keepTimeZone?: boolean
}): string | undefined => {
  const { dateStr, formatFrom = DateFormats.dateStorage, formatTo, keepTimeZone = true } = params
  if (Objects.isEmpty(dateStr)) return undefined

  const dateParsed = parse(dateStr, formatFrom, { keepTimeZone })
  if (!dateParsed || !dayjs(dateParsed).isValid()) {
    return undefined
  }
  // with keepTimeZone the parsed date encodes the source digits as if they were UTC (see parse/parseZone):
  // format it in UTC too, otherwise the digits would be shifted by the time zone of this machine
  return keepTimeZone ? formatUTC(dateParsed, formatTo) : format(dateParsed, formatTo)
}

/**
 * Checks if the date is valid. Takes into account leap years
 * (i.e. 2015/2/29 is not valid).
 */
const isValidDate = (year: any, month: any, day: any): boolean => {
  if (Objects.isEmpty(year) || Objects.isEmpty(month) || Objects.isEmpty(day)) {
    return false
  }

  const date = new Date(year, month - 1, day)

  return (
    dayjs(date).isValid() &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  )
}

const isValidTime = (hour: any = '', minutes: any = '', seconds: any = 0): boolean => {
  if (Objects.isEmpty(hour) || Objects.isEmpty(minutes)) return false
  if (!(Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60)) return false
  return Number(seconds) >= 0 && Number(seconds) < 60
}

const toDate = (date: DateType): Date | undefined => {
  if (Objects.isEmpty(date)) return undefined
  if (date instanceof Date) return date
  if (typeof date === 'string') return parseISO(date)
  if (typeof date === 'number') return new Date(date)
  return undefined
}

const isAfter = (date: DateType, dateToCompare: DateType): boolean => {
  const _date = toDate(date)
  const _dateToCompare = toDate(dateToCompare)
  if (!_date || !_dateToCompare) return false
  return dayjs(_date).isAfter(dayjs(_dateToCompare))
}

const isBefore = (date: DateType, dateToCompare: DateType): boolean => {
  const _date = toDate(date)
  const _dateToCompare = toDate(dateToCompare)
  if (!_date || !_dateToCompare) return false
  return dayjs(_date).isBefore(dayjs(_dateToCompare))
}

const add = (date: DateType, value: number, unit: UnitOfTime): Date => dayjs(date).add(value, unit).toDate()
const addSeconds = (date: DateType, value: number): Date => add(date, value, UnitOfTime.seconds)
const addMinutes = (date: DateType, value: number): Date => add(date, value, UnitOfTime.minutes)
const addHours = (date: DateType, value: number): Date => add(date, value, UnitOfTime.hours)
const addDays = (date: DateType, value: number): Date => add(date, value, UnitOfTime.days)
const addWeeks = (date: DateType, value: number): Date => add(date, value, UnitOfTime.weeks)
const addMonths = (date: DateType, value: number): Date => add(date, value, UnitOfTime.months)
const addYears = (date: DateType, value: number): Date => add(date, value, UnitOfTime.years)

const diff = (dateA: DateType, dateB: DateType, unit: UnitOfTime, precise?: boolean): number =>
  dayjs(dateA).diff(dayjs(dateB), unit, precise)
const diffInSeconds = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.seconds)
const diffInMinutes = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.minutes)
const diffInHours = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.hours)
const diffInDays = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.days)
const diffInWeeks = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.weeks)
const diffInMonths = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.months)
const diffInYears = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.years)

const sub = (date: DateType, value: number, unit: UnitOfTime): Date => dayjs(date).subtract(value, unit).toDate()
const subSeconds = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.seconds)
const subMinutes = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.minutes)
const subHours = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.hours)
const subDays = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.days)
const subWeeks = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.weeks)
const subMonths = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.months)
const subYears = (date: DateType, value: number): Date => sub(date, value, UnitOfTime.years)

/**
 * Gets the difference in minutes between the time on the local computer and Universal Coordinated Time (UTC).
 */
const getTimezoneOffset = (): number => new Date().getTimezoneOffset()

export const Dates = {
  isAfter,
  isBefore,
  isValidDate,
  isValidDateInFormat,
  isValidDateObject,
  isValidTime,
  nowFormattedForStorage,
  nowFormattedForExpression,
  convertDate,
  format,
  formatUTC,
  formatForStorage,
  formatForExpression,
  parse,
  parseISO,
  getTimezoneOffset,
  add,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  sub,
  subSeconds,
  subMinutes,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  diff,
  diffInSeconds,
  diffInMinutes,
  diffInHours,
  diffInDays,
  diffInWeeks,
  diffInMonths,
  diffInYears,
}
