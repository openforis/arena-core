import BigNumber from 'bignumber.js'

import { Objects } from './_objects'

BigNumber.config({
  FORMAT: {
    decimalSeparator: '.',
    groupSeparator: ' ',
    groupSize: 3,
  },
})

const toNumber = (num: any): number => (Objects.isEmpty(num) ? NaN : Number(num))

const isFloat = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isFinite(number)
}

const isInteger = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isInteger(number)
}

const between = (value: number, min: number, max: number): boolean => min <= value && max >= value

/**
 * Formats the given value to the specified fixed dicimal digits.
 */
const formatDecimal = (value: number, decimalDigits = NaN) => {
  if (Number.isNaN(value) || value === null) return null
  const num = new BigNumber(value)

  if (decimalDigits > 0) {
    // round to fixed number of decimal digits
    return num.toFormat(decimalDigits)
  }
  if (decimalDigits === 0) {
    // format as integer
    return num.toFormat(0, { groupSeparator: '' })
  }
  return num.toString()
}

/**
 * Formats the given value to a rounded integer.
 *
 * @param {!number} value - The value to format.
 * @returns {string} - The formatted value or null if the value was null.
 */
const formatInteger = (value: number) => formatDecimal(value, 0)

export const Numbers = {
  between,
  formatDecimal,
  formatInteger,
  isFloat,
  isInteger,
  toNumber,
}
