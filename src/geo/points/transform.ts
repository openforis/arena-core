import proj4 from 'proj4'

import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { isFilled } from './isFilled'

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
  const srsFrom = srsIndex[srsCodeFrom]
  if (!srsFrom) {
    // invalid srs specified in point
    return null
  }

  const srsTo = srsIndex[srsCodeTo]
  if (!srsTo) {
    // invalid target srs code
    return null
  }
  try {
    const { x, y } = point
    const [long, lat] = proj4(srsFrom.wkt, srsTo.wkt, [x, y])

    return PointFactory.createInstance({ ...point, srs: srsCodeTo, x: long, y: lat })
  } catch (error) {
    return null
  }
}
