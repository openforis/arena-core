import { isNil } from './isNil'

/**
 * Determines if the specified value is null, undefined, empty string, NaN, invalid date, empty object or empty array.
 *
 * @param {any} value - Value to verify.
 * @returns {boolean} True if the specified value is empty, false otherwise.
 */
export const isEmpty = (value: any): boolean =>
  isNil(value) ||
  value === '' ||
  Number.isNaN(value) ||
  (value instanceof Date && isNaN(value.getTime())) ||
  (typeof value !== 'function' &&
    value instanceof Object &&
    !(value instanceof Date) &&
    Object.entries(value).length === 0) ||
  (Array.isArray(value) && value.length === 0)
