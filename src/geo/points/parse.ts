import { Point } from '../point'
import { PointFactory } from '../pointFactory'

const POINT_REGEX = /SRID=((EPSG:)?(\w+));POINT\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/

/**
 * Parses a point in the format: SRID=SRS_CODE;POINT(X Y)
 * Valid examples are:
 * - SRID=EPSG:4326;POINT(12.489060, 41.882788)
 * - SRID=4326;POINT(12, 41).
 *
 * @param {!(string | object)} value - The point to parse. It can be a string or an object.
 * @returns {Point} - The parsed Point object.
 */
export const parse = (value: string | object): Point | null => {
  if (!value) return null

  if (typeof value === 'object') return value as Point

  if (typeof value === 'string') {
    const match = POINT_REGEX.exec(value)
    if (!match) return null

    const srs = match[3]
    const x = Number(match[4])
    const y = Number(match[6])
    return PointFactory.createInstance({ srs, x, y })
  }
  return null
}
