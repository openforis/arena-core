import { Objects } from '../../utils'
import { Point } from '../point'

export const isFilled = (point: Point): boolean =>
  !Objects.isEmpty(point.srs) && !Objects.isEmpty(point.x) && !Objects.isEmpty(point.y)
