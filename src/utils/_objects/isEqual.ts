import { isEqual as _isEqual } from 'es-toolkit/predicate'

/**
 * Performs a deep comparison between two values to determine if they are equivalent
 * (same semantics as lodash isEqual).
 */
export const isEqual = (value: unknown, other: unknown): boolean => _isEqual(value, other)
