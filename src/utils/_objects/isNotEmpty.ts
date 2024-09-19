import { isEmpty } from './isEmpty'

/**
 * Opposite of isEmpty.
 *
 * @param {any} value - Value to verify.
 * @returns {boolean} True if the specified value is not empty, false otherwise.
 */
export const isNotEmpty = (value: any): boolean => !isEmpty(value)
