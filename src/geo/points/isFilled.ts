import { Objects } from '../../utils'
import { ArenaPoint } from '../point'

export const isFilled = (point: ArenaPoint | null | undefined): point is ArenaPoint =>
  !!point &&
  !Objects.isEmpty(point) &&
  !Objects.isEmpty(point.srs) &&
  !Objects.isEmpty(point.x) &&
  !Objects.isEmpty(point.y)
