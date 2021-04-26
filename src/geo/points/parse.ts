import { Point } from '../point'
import { PointFactory } from '../pointFactory'

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
export const parse = (pointText: string): Point | null => {
  const match = POINT_REGEX.exec(pointText)
  if (!match) return null

  const srs = match[3]
  const x = Number(match[4])
  const y = Number(match[6])
  return PointFactory.createInstance({ srs, x, y })
}
