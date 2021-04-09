import { Point } from '../point'

export const equals = (point1: Point, point2: Point): boolean => {
  if (point1 === point2) return true
  return point1.srs === point2.srs && point1.x === point2.x && point1.y === point2.y
}
