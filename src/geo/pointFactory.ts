import { Factory } from '../common'
import { Point } from './point'

export type PointFactoryParams = {
  srs: string
  x: number
  y: number
}

export const PointFactory: Factory<Point, PointFactoryParams> = {
  createInstance: (params: PointFactoryParams): Point => {
    const { srs, x, y } = params
    return { srs, x, y }
  },
}
