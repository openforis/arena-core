import { DEFAULT_SRS, ArenaSRSIndex } from '../../srs'
import { ArenaPoint } from '../point'
import { transform } from './transform'

export const toLatLong = (point: ArenaPoint, srsIndex: ArenaSRSIndex): ArenaPoint | null =>
  transform(point, DEFAULT_SRS.code, srsIndex)
