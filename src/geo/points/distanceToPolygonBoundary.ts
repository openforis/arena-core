import pointToPolygonDistance from '@turf/point-to-polygon-distance'

import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { AreaOfInterest } from '../areaOfInterest'
import { Point } from '../point'
import { toLatLong } from './toLatLong'

/**
 * Returns the distance (in meters) between a point and the boundary of a polygon: negative inside, positive outside.
 *
 * @param {!Point} point - The point.
 * @param {!AreaOfInterest} polygon - Polygon or multi polygon in WGS84.
 * @param {!SRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number|null} - The signed distance in meters, or null if the point or the polygon are not valid.
 */
export const distanceToPolygonBoundary = (
  point: Point,
  polygon: AreaOfInterest,
  srsIndex: SRSIndex = DEFAULT_SRS_INDEX
): number | null => {
  const pointLatLong = toLatLong(point, srsIndex)
  if (!pointLatLong) return null
  try {
    // turf expects [longitude, latitude]; planar: polygon edges are straight lines (as in GeoJSON and on the map),
    // consistent with the inside/outside check (geodesic would measure to great-circle edges)
    return pointToPolygonDistance([pointLatLong.x, pointLatLong.y], polygon, { units: 'meters', method: 'planar' })
  } catch {
    // invalid polygon geometry
    return null
  }
}
