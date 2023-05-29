import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { Point } from '../point'
import { toLatLong } from './toLatLong'

/**
 * Takes two points and returns the distance between them as the crow flies (in meters).
 *
 * @param {!object} pointFrom - Start point.
 * @param {!object} pointTo - End point.
 * @param {!SRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number} - Distance between the specified points in meters.
 */
export const distance = (pointFrom: Point, pointTo: Point, srsIndex: SRSIndex = DEFAULT_SRS_INDEX): number | null => {
  const point1LatLong = toLatLong(pointFrom, srsIndex)
  const point2LatLong = toLatLong(pointTo, srsIndex)

  if (!point1LatLong || !point2LatLong) return null

  const toRad = (value: number): number => (value * Math.PI) / 180

  const long1 = point1LatLong.x
  const lat1 = point1LatLong.y
  const long2 = point2LatLong.x
  const lat2 = point2LatLong.y

  const earthRadius = 6371000 // Earth radius in meters
  const distanceLat = toRad(lat2 - lat1)
  const distanceLong = toRad(long2 - long1)
  const lat1Rad = toRad(lat1)
  const lat2Rad = toRad(lat2)

  const a = Math.sin(distanceLat / 2) ** 2 + Math.sin(distanceLong / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}
