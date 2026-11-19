import turfDistance from '@turf/distance'
import { DEFAULT_SRS_INDEX, ArenaSRSIndex } from '../../srs'
import { ArenaPoint } from '../point'
import { toLatLong } from './toLatLong'

/**
 * Takes two points and returns the distance between them as the crow flies (in meters).
 *
 * @param {!object} pointFrom - Start point.
 * @param {!object} pointTo - End point.
 * @param {!ArenaSRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number} - Distance between the specified points in meters.
 */
export const distance = (
  pointFrom: ArenaPoint,
  pointTo: ArenaPoint,
  srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX
): number | null => {
  const point1LatLong = toLatLong(pointFrom, srsIndex)
  const point2LatLong = toLatLong(pointTo, srsIndex)

  if (!point1LatLong || !point2LatLong) return null

  // Turf expects [longitude, latitude] format
  const from = [point1LatLong.x, point1LatLong.y]
  const to = [point2LatLong.x, point2LatLong.y]

  return turfDistance(from, to, { units: 'meters' })
}
