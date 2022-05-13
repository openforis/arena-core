import { format, parse as dateFnsParse, isValid as fnsIsValid } from 'date-fns'
import { Objects } from './_objects'

export enum DateFormats {
  dateDisplay = 'dd/MM/yyyy',
  dateISO = 'yyyy-MM-dd',
  datetimeStorage = 'yyyy-MM-dd_HH-mm-ss',
  datetimeDisplay = 'dd/MM/yyyy HH:mm:ss',
  datetimeISO = `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`,
  timeStorage = 'HH:mm',
  datetimeDefault = 'yyyy-MM-dd_HH-mm-ss',
}

const nowFormattedForStorage = (): string => format(Date.now(), DateFormats.datetimeStorage)

const parse = (dateStr: string, format: DateFormats) => dateFnsParse(dateStr, format, new Date())

const isValidDateInFormat = (dateStr: string, format: DateFormats) => {
  const parsed = parse(dateStr, format)
  return fnsIsValid(parsed)
}

export const convertDate = (params: {
  dateStr: string
  formatFrom?: DateFormats
  formatTo: DateFormats
  adjustTimezoneDifference?: boolean
}): any => {
  const { dateStr, formatFrom = DateFormats.dateISO, formatTo, adjustTimezoneDifference = false } = params
  if (Objects.isEmpty(dateStr)) return null

  const dateParsed = parse(dateStr, formatFrom)
  if (!fnsIsValid(dateParsed)) {
    return null
  }
  let dateAdjusted
  if (adjustTimezoneDifference) {
    const timezoneOffset = dateParsed.getTimezoneOffset() * 60000
    dateAdjusted = new Date(dateParsed.getTime() - timezoneOffset)
  } else {
    dateAdjusted = dateParsed
  }
  return format(dateAdjusted, formatTo)
}

export const Dates = {
  isValidDateInFormat,
  nowFormattedForStorage,
  convertDate,
}
