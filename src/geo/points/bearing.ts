import { bearing as bearingTurf } from '@turf/bearing'

import { Point } from '../point'
import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { toLatLong } from './toLatLong'
import { Numbers } from '../../utils'

/**
 * Calculates the angle (bearing) in degrees from pointFrom to pointTo.
 * Returns the clockwise angle from north (0° = north, 90° = east, 180° = south, 270° = west).
 *
 * @param {!object} pointFrom - Start point.
 * @param {!object} pointTo - End point.
 * @param {!SRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number} - Bearing angle in degrees [0-360).
 */
export const bearing = (pointFrom: Point, pointTo: Point, srsIndex: SRSIndex = DEFAULT_SRS_INDEX): number | null => {
  const point1LatLong = toLatLong(pointFrom, srsIndex)
  const point2LatLong = toLatLong(pointTo, srsIndex)

  if (!point1LatLong || !point2LatLong) return null

  // Turf expects [longitude, latitude] format
  const from = [point1LatLong.x, point1LatLong.y]
  const to = [point2LatLong.x, point2LatLong.y]

  // Turf returns bearings in the range [-180, 180]; normalize to [0, 360)
  const rawBearing = bearingTurf(from, to)
  return Numbers.absMod(360)(rawBearing)
}
