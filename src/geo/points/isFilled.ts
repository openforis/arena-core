import { Objects } from '../../utils'
import { ArenaPoint } from '../point'

export const isFilled = (point: ArenaPoint): boolean =>
  !Objects.isEmpty(point) && !Objects.isEmpty(point.srs) && !Objects.isEmpty(point.x) && !Objects.isEmpty(point.y)
