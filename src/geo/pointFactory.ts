import { Factory } from '../common'
import { DEFAULT_SRS } from '../srs'
import { Point } from './point'

export type PointFactoryParams = {
  srs?: string
  x: number
  y: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
}

export const PointFactory: Factory<Point, PointFactoryParams> = {
  createInstance: (params: PointFactoryParams): Point => {
    return { ...params, srs: params.srs || DEFAULT_SRS.code }
  },
}
