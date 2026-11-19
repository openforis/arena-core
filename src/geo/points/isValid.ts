import { DEFAULT_SRS_INDEX, ArenaSRSIndex } from '../../srs'
import { Numbers } from '../../utils'
import { ArenaPoint } from '../point'
import { PointFactory } from '../pointFactory'
import { equals } from './equals'
import { getSrs } from './getSrs'
import { isFilled } from './isFilled'
import { toLatLong } from './toLatLong'

const INVALID_LAT_LONG_POINT: ArenaPoint = PointFactory.createInstance({ x: 0, y: 90 }) // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

export const isValid = (point: ArenaPoint, srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX): boolean => {
  if (!point || !isFilled(point)) return false

  if (!getSrs({ code: point.srs, srsIndex })) return false

  const pointLatLong = toLatLong(point, srsIndex)
  if (!pointLatLong || equals(pointLatLong, INVALID_LAT_LONG_POINT)) return false

  return Numbers.between(pointLatLong.x, -180, 180) && Numbers.between(pointLatLong.y, -90, 90)
}
