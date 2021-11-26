import proj4 from 'proj4'

import { SRSs } from '../../srs'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { isFilled } from './isFilled'

/**
 * Trasforms the specified point from one SRS into another.
 *
 * @param {!Point} point - The point to transform.
 * @param {!string} srsTo - The SRS code to transform the coordinate into.
 * @returns {Point|null} - The transformed Point object, null if an error occurred.
 */
export const transform = (point: Point, srsTo: string): Point | null => {
  if (!isFilled(point)) return null

  const { x, y, srs } = point

  if (srs === srsTo) {
    // projection is not needed
    return point
  }

  const srsFromObj = SRSs.getSRSByCode(srs)
  if (!srsFromObj) {
    // invalid srs specified in point
    return null
  }

  const srsToObj = SRSs.getSRSByCode(srsTo)
  if (!srsToObj) {
    // invalid target srs code
    return null
  }
  try {
    const [long, lat] = proj4(srsFromObj.wkt, srsToObj.wkt, [x, y])

    return PointFactory.createInstance({ srs: srsToObj.code, x: long, y: lat })
  } catch (error) {
    return null
  }
}
