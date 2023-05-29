import { DEFAULT_SRS_INDEX, SRSIndex } from '../../srs'
import { Numbers } from '../../utils'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { equals } from './equals'
import { isFilled } from './isFilled'
import { toLatLong } from './toLatLong'

const INVALID_LAT_LONG_POINT: Point = PointFactory.createInstance({ x: 0, y: 90 }) // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

export const isValid = (point: Point, srsIndex: SRSIndex = DEFAULT_SRS_INDEX): boolean => {
  if (!point || !isFilled(point)) return false

  if (!srsIndex[point.srs]) return false

  const pointLatLong = toLatLong(point, srsIndex)
  if (!pointLatLong || equals(pointLatLong, INVALID_LAT_LONG_POINT)) return false

  return Numbers.between(pointLatLong.x, -180, 180) && Numbers.between(pointLatLong.y, -90, 90)
}
