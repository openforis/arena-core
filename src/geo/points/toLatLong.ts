import { DEFAULT_SRS } from '../../srs'
import { Point } from '../point'
import { transform } from './transform'

export const toLatLong = (point: Point): Point | null => transform(point, DEFAULT_SRS.code)
