import { DEFAULT_SRS, SRSIndex } from '../../srs'
import { Point } from '../point'
import { transform } from './transform'

export const toLatLong = (point: Point, srsIndex: SRSIndex): Point | null =>
  transform(point, DEFAULT_SRS.code, srsIndex)
