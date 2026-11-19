import { ArenaPoint } from '../point'

export const toString = (point: ArenaPoint): string => `SRID=${point.srs};POINT(${point.x} ${point.y})`
