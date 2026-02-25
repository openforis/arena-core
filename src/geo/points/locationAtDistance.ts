import turfDestination from '@turf/destination'

import { SRSIndex } from '../../srs'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { toLatLong } from './toLatLong'
import { transform } from './transform'

/**
 * Takes a point, a distance in meters, and a bearing in degrees, and returns the location of the point at the specified distance and bearing from the original point.
 * @param params
 * @param params.origin - The original point from which to calculate the new location.
 * @param params.distanceMeters - The distance in meters from the original point to the new location.
 * @param params.bearingDeg - The bearing in degrees from the original point to the new location.
 * @param params.srsIndex - SRSs indexed by SRS code.
 * @returns The new point at the specified distance and bearing from the original point, or null if the calculation fails.
 */
export const locationAtDistance = ({
  origin,
  distanceMeters,
  bearingDeg,
  srsIndex,
}: {
  origin: Point
  distanceMeters: number
  bearingDeg: number
  srsIndex: SRSIndex
}): Point | null => {
  const originLatLong = toLatLong(origin, srsIndex)

  if (!originLatLong) return null

  const target = turfDestination([originLatLong.x, originLatLong.y], distanceMeters, bearingDeg, { units: 'meters' })
  const targetPointLatLong = PointFactory.createInstance({
    x: target.geometry.coordinates[0],
    y: target.geometry.coordinates[1],
  })
  return transform(targetPointLatLong, origin.srs, srsIndex)
}
