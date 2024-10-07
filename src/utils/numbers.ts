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

/**
 * Returns the absolute modulus of the specified value. The result will always be a positive number.
 * @param {!number} modulus - The modulus to apply.
 * @returns {number} - The result of the modulus (always positive or 0).
 */
const absMod =
  (modulus: number) =>
  (value: number): number =>
    ((value % modulus) + modulus) % modulus

const between = (value: number, min: number, max: number): boolean => min <= value && max >= value

const isFloat = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isFinite(number)
}

const isInteger = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isInteger(number)
}

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
const formatInteger = (value: number): string | null => formatDecimal(value, 0)

const limit =
  ({ minValue = NaN, maxValue = NaN }) =>
  (value: number) => {
    let result = Number(value)
    if (minValue) result = Math.max(minValue, result)
    if (maxValue) result = Math.min(maxValue, result)
    return result
  }

const roundToPrecision = (value: any, precision = NaN) => {
  const num = toNumber(value)
  if (Number.isNaN(num)) return NaN
  if (Number.isNaN(precision)) return num
  const exp = Math.pow(10, precision)
  return Math.round(num * exp) / exp
}

export const Numbers = {
  absMod,
  between,
  formatDecimal,
  formatInteger,
  isFloat,
  isInteger,
  limit,
  roundToPrecision,
  toNumber,
}
