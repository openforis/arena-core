import moment from 'moment'
import { Objects } from './_objects'

export enum DateFormats {
  dateDisplay = 'DD/MM/YYYY',
  dateStorage = 'YYYY-MM-DD',
  datetimeDisplay = 'DD/MM/YYYY HH:mm:ss',
  datetimeStorage = `YYYY-MM-DD'T'HH:mm:ss.SSS'Z'`, // ISO
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

const format = (date: number | Date | undefined, format: string): string => (date ? moment(date).format(format) : '')

const formatForStorage = (date: DateType): string => new Date(date).toISOString()
const formatForExpression = (date: DateType): string => format(new Date(date), DateFormats.datetimeDefault)

const nowFormattedForStorage = (): string => formatForStorage(new Date())
const nowFormattedForExpression = (): string => formatForExpression(Date.now())

const parseISO = (dateStr: string): Date | undefined => (dateStr ? moment(dateStr).toDate() : undefined)
const parse = (dateStr: string, format: DateFormats): Date | undefined => {
  if (!dateStr) return undefined
  if (format == DateFormats.datetimeStorage) return parseISO(dateStr)
  return moment(dateStr, format).toDate()
}

const isValidDateInFormat = (dateStr: string, format: DateFormats) => {
  const parsed = parse(dateStr, format)
  return parsed && moment(parsed).isValid()
}

const convertDate = (params: {
  dateStr: string
  formatFrom?: DateFormats
  formatTo: DateFormats
}): string | undefined => {
  const { dateStr, formatFrom = DateFormats.dateStorage, formatTo } = params
  if (Objects.isEmpty(dateStr)) return undefined

  const dateParsed = parse(dateStr, formatFrom)
  if (!dateParsed || !moment(dateParsed).isValid()) {
    return undefined
  }
  return format(dateParsed, formatTo)
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
    Boolean(moment(date).isValid()) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  )
}

const isValidTime = (hour: any = '', minutes: any = ''): boolean =>
  Objects.isEmpty(hour) || Objects.isEmpty(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60

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
  return moment(_date).isAfter(moment(_dateToCompare))
}

const isBefore = (date: DateType, dateToCompare: DateType): boolean => {
  const _date = toDate(date)
  const _dateToCompare = toDate(dateToCompare)
  if (!_date || !_dateToCompare) return false
  return moment(_date).isBefore(moment(_dateToCompare))
}

const add = (date: DateType, value: number, unit: UnitOfTime): Date => moment(date).add(value, unit).toDate()
const addSeconds = (date: DateType, value: number): Date => add(date, value, UnitOfTime.seconds)
const addMinutes = (date: DateType, value: number): Date => add(date, value, UnitOfTime.minutes)
const addHours = (date: DateType, value: number): Date => add(date, value, UnitOfTime.hours)
const addDays = (date: DateType, value: number): Date => add(date, value, UnitOfTime.days)
const addWeeks = (date: DateType, value: number): Date => add(date, value, UnitOfTime.weeks)
const addMonths = (date: DateType, value: number): Date => add(date, value, UnitOfTime.months)
const addYears = (date: DateType, value: number): Date => add(date, value, UnitOfTime.years)

const diff = (dateA: DateType, dateB: DateType, unit: UnitOfTime, precise?: boolean): number =>
  moment(dateA).diff(moment(dateB), unit, precise)
const diffInSeconds = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.seconds)
const diffInMinutes = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.minutes)
const diffInHours = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.hours)
const diffInDays = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.days)
const diffInWeeks = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.weeks)
const diffInMonths = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.months)
const diffInYears = (dateA: DateType, dateB: DateType): number => diff(dateA, dateB, UnitOfTime.years)

const sub = (date: DateType, value: number, unit: UnitOfTime): Date => moment(date).subtract(value, unit).toDate()
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
  isValidDateInFormat,
  isValidDate,
  isValidTime,
  nowFormattedForStorage,
  nowFormattedForExpression,
  convertDate,
  format,
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
