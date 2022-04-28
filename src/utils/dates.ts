import { format } from 'date-fns'

enum Formats {
  dateDisplay = 'dd/MM/yyyy',
  dateISO = 'yyyy-MM-dd',
  datetimeStorage = 'yyyy-MM-dd_HH-mm-ss',
  datetimeDisplay = 'dd/MM/yyyy HH:mm:ss',
  datetimeISO = `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`,
  timeStorage = 'HH:mm',
}

const nowFormattedForStorage = (): string => format(Date.now(), Formats.datetimeStorage)

export const Dates = {
  nowFormattedForStorage,
}
