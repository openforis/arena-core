import pointToPolygonDistance from '@turf/point-to-polygon-distance'

import { DEFAULT_SRS_INDEX, ArenaSRSIndex } from '../../srs'
import { ArenaAreaOfInterest } from '../areaOfInterest'
import { ArenaPoint } from '../point'
import { toLatLong } from './toLatLong'

/**
 * Returns the distance (in meters) between a point and the boundary of a polygon: negative inside, positive outside.
 *
 * @param {!ArenaPoint} point - The point.
 * @param {!ArenaAreaOfInterest} polygon - Polygon or multi polygon in WGS84.
 * @param {!ArenaSRSIndex} srsIndex - SRSs indexed by SRS code.
 * @returns {number|null} - The signed distance in meters, or null if the point or the polygon are not valid.
 */
export const distanceToPolygonBoundary = (
  point: ArenaPoint,
  polygon: ArenaAreaOfInterest,
  srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX
): number | null => {
  const pointLatLong = toLatLong(point, srsIndex)
  if (!pointLatLong) return null
  try {
    // turf expects [longitude, latitude]; planar: polygon edges are straight lines (as in GeoJSON and on the map),
    // consistent with the inside/outside check (geodesic would measure to great-circle edges)
    // shortcut: polygons crossing the antimeridian (longitudes jumping from 180 to -180) are measured wrong,
    // split them in 2 polygons (one for each side) if such areas of interest are needed
    return pointToPolygonDistance([pointLatLong.x, pointLatLong.y], polygon, { units: 'meters', method: 'planar' })
  } catch {
    // invalid polygon geometry
    return null
  }
}
