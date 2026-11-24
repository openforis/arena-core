import proj4, { type Converter } from 'proj4'

import { SystemError, SystemErrorKeys } from '../../error'
import { DEFAULT_SRS_INDEX, ArenaSRSIndex } from '../../srs'
import { ArenaPoint } from '../point'
import { PointFactory } from '../pointFactory'
import { isFilled } from './isFilled'
import { getSrs } from './getSrs'

// proj4 parses both WKT strings every time it is called with them: cache the converters by WKT pair
const convertersCache = new Map<string, Converter>()

const getConverter = (wktFrom: string, wktTo: string): Converter => {
  const key = `${wktFrom}\n${wktTo}`
  let converter = convertersCache.get(key)
  if (!converter) {
    converter = proj4(wktFrom, wktTo)
    convertersCache.set(key, converter)
  }
  return converter
}

/**
 * Transforms the specified point from one SRS into another, throwing a SystemError with the reason when it cannot.
 *
 * @param point - The point to transform.
 * @param srsCodeTo - The SRS code to transform the point into.
 * @param srsIndex - SRSs indexed by SRS code.
 * @returns The transformed point (the point itself if it is already in the target SRS).
 * @throws {SystemError} `geo.pointNotFilled`, `geo.srsNotFound` (with the `code` param) or `geo.transformFailed`.
 */
export const transformOrThrow = (
  point: ArenaPoint | null | undefined,
  srsCodeTo: string,
  srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX
): ArenaPoint => {
  if (!isFilled(point)) throw new SystemError(SystemErrorKeys.geo.pointNotFilled)

  const { srs: srsCodeFrom } = point

  if (srsCodeFrom === srsCodeTo) {
    // projection is not needed
    return point
  }
  const srsFrom = getSrs({ code: srsCodeFrom, srsIndex })
  if (!srsFrom) throw new SystemError(SystemErrorKeys.geo.srsNotFound, { code: srsCodeFrom })

  const srsTo = getSrs({ code: srsCodeTo, srsIndex })
  if (!srsTo) throw new SystemError(SystemErrorKeys.geo.srsNotFound, { code: srsCodeTo })

  try {
    const { x, y } = point
    const [long, lat] = getConverter(srsFrom.wkt, srsTo.wkt).forward([Number(x), Number(y)])

    return PointFactory.createInstance({ ...point, srs: srsCodeTo, x: long, y: lat })
  } catch (error) {
    throw new SystemError(
      SystemErrorKeys.geo.transformFailed,
      { srsFrom: srsCodeFrom, srsTo: srsCodeTo },
      { cause: error }
    )
  }
}

/**
 * Transforms the specified point from one SRS into another.
 * Use `transformOrThrow` to know why a point cannot be transformed.
 *
 * @param point - The point to transform.
 * @param srsCodeTo - The SRS code to transform the point into.
 * @param srsIndex - SRSs indexed by SRS code.
 * @returns The transformed point, or null if the point is not filled, an SRS is unknown or the transformation fails.
 */
export const transform = (
  point: ArenaPoint | null | undefined,
  srsCodeTo: string,
  srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX
): ArenaPoint | null => {
  try {
    return transformOrThrow(point, srsCodeTo, srsIndex)
  } catch {
    return null
  }
}
