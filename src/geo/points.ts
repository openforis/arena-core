import proj4 from 'proj4'

import { Objects } from '../utils'
import { DEFAULT_SRS, SRSs } from '../srs'
import { Point } from './point'
import { PointFactory } from './pointFactory'

const POINT_REGEX = /SRID=((EPSG:)?(\w+));POINT\((\d+(\.\d+)?) (\d+(\.\d+)?)\)/

/**
 * Parses a point in the format: SRID=SRS_CODE;POINT(X Y)
 * Valid examples are:
 * - SRID=EPSG:4326;POINT(12.489060, 41.882788)
 * - SRID=4326;POINT(12, 41).
 *
 * @param {!string} pointText - The point to parse.
 * @returns {Point} - The parsed Point object.
 */
const parse = (pointText: string): Point | null => {
  const match = POINT_REGEX.exec(pointText)
  return match ? PointFactory.createInstance({ srs: match[3], x: Number(match[4]), y: Number(match[6]) }) : null
}

const isFilled = (point: Point): boolean =>
  !Objects.isEmpty(point.srs) && !Objects.isEmpty(point.x) && !Objects.isEmpty(point.y)

const toLatLong = (point: Point): Point | null => {
  if (!isFilled(point)) return null

  const { x, y, srs } = point

  if (srs === DEFAULT_SRS.code) {
    // projection is not needed
    return point
  }

  const srsFrom = SRSs.getSRSByCode(srs)

  const srsTo = DEFAULT_SRS
  const [long, lat] = proj4(srsFrom.wkt, srsTo.wkt, [x, y])
  return PointFactory.createInstance({ srs: DEFAULT_SRS.code, x: long, y: lat })
}

/**
 * Takes two points and returns the distance between them as the crow flies (in meters).
 *
 * @param {!object} pointFrom - Start point.
 * @param {!object} pointTo - End point.
 * @returns {number} - Distance between the specified points in meters.
 */
const distance = (pointFrom: Point, pointTo: Point): number | null => {
  const point1LatLong = toLatLong(pointFrom)
  const point2LatLong = toLatLong(pointTo)

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

export const Points = {
  parse,
  distance,
}
