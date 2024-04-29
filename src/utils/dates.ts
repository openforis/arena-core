import {
  format as dateFnsFormat,
  parse as dateFnsParse,
  parseISO as dateFnsParseISO,
  isAfter as dateFnsIsAfter,
  isBefore as dateFnsIsBefore,
  isValid as fnsIsValid,
} from 'date-fns'
import { Objects } from './_objects'

export enum DateFormats {
  dateDisplay = 'dd/MM/yyyy',
  dateStorage = 'yyyy-MM-dd',
  datetimeDisplay = 'dd/MM/yyyy HH:mm:ss',
  datetimeStorage = `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`, // ISO
  timeStorage = 'HH:mm',
  timeWithSeconds = 'HH:mm:ss',
  datetimeDefault = 'yyyy-MM-dd_HH-mm-ss',
}

type DateType = Date | number | string

const format = (date: number | Date, format: string): string => (date ? dateFnsFormat(date, format) : '')

const formatForStorage = (date: DateType): string => new Date(date).toISOString()
const formatForExpression = (date: DateType): string => format(new Date(date), DateFormats.datetimeDefault)

const nowFormattedForStorage = (): string => formatForStorage(new Date())
const nowFormattedForExpression = (): string => formatForExpression(Date.now())

const parseISO = (dateStr: string) => dateFnsParseISO(dateStr)
const parse = (dateStr: string, format: DateFormats) =>
  format == DateFormats.datetimeStorage ? parseISO(dateStr) : dateFnsParse(dateStr, format, new Date())

const isValidDateInFormat = (dateStr: string, format: DateFormats) => {
  const parsed = parse(dateStr, format)
  return fnsIsValid(parsed)
}

const convertDate = (params: { dateStr: string; formatFrom?: DateFormats; formatTo: DateFormats }): any => {
  const { dateStr, formatFrom = DateFormats.dateStorage, formatTo } = params
  if (Objects.isEmpty(dateStr)) return null

  const dateParsed = parse(dateStr, formatFrom)
  if (!fnsIsValid(dateParsed)) {
    return null
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
    Boolean(fnsIsValid(date)) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  )
}

const isValidTime = (hour: any = '', minutes: any = ''): boolean =>
  Objects.isEmpty(hour) || Objects.isEmpty(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60

const toDate = (date: DateType): Date | null => {
  if (Objects.isEmpty(date)) return null
  if (date instanceof Date) return date
  if (typeof date === 'string') return parseISO(date)
  if (typeof date === 'number') return new Date(date)
  return null
}

const isAfter = (date: DateType, dateToCompare: DateType): boolean => {
  const _date = toDate(date)
  const _dateToCompare = toDate(dateToCompare)
  if (!_date || !_dateToCompare) return false
  return dateFnsIsAfter(_date, _dateToCompare)
}

const isBefore = (date: DateType, dateToCompare: DateType): boolean => {
  const _date = toDate(date)
  const _dateToCompare = toDate(dateToCompare)
  if (!_date || !_dateToCompare) return false
  return dateFnsIsBefore(_date, _dateToCompare)
}

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
}
