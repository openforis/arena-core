import proj4 from 'proj4'

import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { isFilled } from './isFilled'
import { getSrs } from './getSrs'

// proj4 parses both WKT strings every time it is called with them: cache the converters by WKT pair
const convertersCache = new Map<string, proj4.Converter>()

const getConverter = (wktFrom: string, wktTo: string): proj4.Converter => {
  const key = `${wktFrom}\n${wktTo}`
  let converter = convertersCache.get(key)
  if (!converter) {
    converter = proj4(wktFrom, wktTo)
    convertersCache.set(key, converter)
  }
  return converter
}

/**
 * Trasforms the specified point from one SRS into another.
 *
 * @param {!Point} point - The point to transform.
 * @param {!string} srsCodeTo - The SRS code to transform the coordinate into.
 * @param {SRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {Point|null} - The transformed Point object, null if an error occurred.
 */
export const transform = (point: Point, srsCodeTo: string, srsIndex: SRSIndex = DEFAULT_SRS_INDEX): Point | null => {
  if (!isFilled(point)) return null

  const { srs: srsCodeFrom } = point

  if (srsCodeFrom === srsCodeTo) {
    // projection is not needed
    return point
  }
  const srsFrom = getSrs({ code: srsCodeFrom, srsIndex })
  if (!srsFrom) {
    // invalid srs specified in point
    return null
  }

  const srsTo = getSrs({ code: srsCodeTo, srsIndex })
  if (!srsTo) {
    // invalid target srs code
    return null
  }
  try {
    const { x, y } = point
    const [long, lat] = getConverter(srsFrom.wkt, srsTo.wkt).forward([Number(x), Number(y)])

    return PointFactory.createInstance({ ...point, srs: srsCodeTo, x: long, y: lat })
  } catch {
    return null
  }
}
