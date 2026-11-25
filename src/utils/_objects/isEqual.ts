import { isEqual as _isEqual } from 'es-toolkit/predicate'

/**
 * Performs a deep comparison between two values to determine if they are equivalent
 * (same semantics as lodash isEqual).
 * Params typed as any: with unknown, when passed as an equality function (e.g. to react-redux useSelector),
 * the compared type would be inferred as unknown.
 */
export const isEqual = (value: any, other: any): boolean => _isEqual(value, other)
