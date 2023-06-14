/**
 * Determines if the specified value is null or undefined.
 *
 * @param {any} value - Value to verify.
 * @returns {boolean} True if the specified value is null or undefined, false otherwise.
 */
export const isNil = (value: any): boolean => value === undefined || value === null
