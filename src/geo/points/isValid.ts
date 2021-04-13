import { DEFAULT_SRS, SRSs } from '../../srs'
import { Numbers } from '../../utils'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { equals } from './equals'
import { isFilled } from './isFilled'
import { toLatLong } from './toLatLong'

const INVALID_LAT_LONG_POINT: Point = PointFactory.createInstance({ srs: DEFAULT_SRS.code, x: 0, y: 90 }) // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

export const isValid = (point: Point): boolean => {
  if (!point || !isFilled(point)) return false

  if (!SRSs.getSRSByCode(point.srs)) return false

  const pointLatLong = toLatLong(point)
  if (!pointLatLong || equals(pointLatLong, INVALID_LAT_LONG_POINT)) return false

  return Numbers.between(pointLatLong.x, -180, 180) && Numbers.between(pointLatLong.y, -90, 90)
}
