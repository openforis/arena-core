import { DEFAULT_SRS, DEFAULT_SRS_INDEX, ArenaSRSIndex } from '../../srs'
import { ArenaPoint } from '../point'
import { transform } from './transform'

export const toLatLong = (
  point: ArenaPoint | null | undefined,
  srsIndex: ArenaSRSIndex = DEFAULT_SRS_INDEX
): ArenaPoint | null => transform(point, DEFAULT_SRS.code, srsIndex)
