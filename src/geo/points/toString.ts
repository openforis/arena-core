import { Point } from '../point'

export const toString = (point: Point): string => `SRID=${point.srs};POINT(${point.x} ${point.y})`
