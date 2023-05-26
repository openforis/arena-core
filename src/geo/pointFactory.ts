import { Factory } from '../common'
import { DEFAULT_SRS } from '../srs'
import { Point } from './point'

export type PointFactoryParams = {
  srs?: string
  x: number
  y: number
}

export const PointFactory: Factory<Point, PointFactoryParams> = {
  createInstance: (params: PointFactoryParams): Point => {
    const { srs = DEFAULT_SRS.code, x, y } = params
    return { srs, x, y }
  },
}
