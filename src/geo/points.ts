import proj4 from 'proj4'

import { Numbers, Objects } from '../utils'
import { DEFAULT_SRS, SRSs } from '../srs'
import { Point } from './point'
import { PointFactory } from './pointFactory'

const INVALID_LAT_LONG_POINT: Point = PointFactory.createInstance({ srs: DEFAULT_SRS.code, x: 0, y: 90 }) // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

const POINT_REGEX = /SRID=((EPSG:)?(\w+));POINT\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/

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
  if (!match) return null

  const srs = match[3]
  const x = Number(match[4])
  const y = Number(match[6])
  return PointFactory.createInstance({ srs, x, y })
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

const equals = (point1: Point, point2: Point): boolean => {
  if (point1 === null && point2 === null) return true
  if (point1 === null || point2 === null) return false
  return point1.srs === point2.srs && point1.x === point2.x && point1.y === point2.y
}

const isValid = (point: Point): boolean => {
  if (!point || !isFilled(point)) return false

  try {
    SRSs.getSRSByCode(point.srs)
  } catch (e) {
    // SRS not found
    return false
  }

  const pointLatLong = toLatLong(point)
  if (!pointLatLong || equals(pointLatLong, INVALID_LAT_LONG_POINT)) return false

  return Numbers.between(pointLatLong.x, -180, 180) && Numbers.between(pointLatLong.y, -90, 90)
}

const toString = (point: Point): string => `SRID=${point.srs};POINT(${point.x} ${point.y})`

export const Points = {
  parse,
  distance,
  equals,
  isValid,
  toString,
}
