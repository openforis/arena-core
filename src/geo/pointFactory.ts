import { ArenaFactory } from '../common'
import { DEFAULT_SRS } from '../srs'
import { ArenaPoint } from './point'

export type PointFactoryParams = {
  srs?: string
  x: number
  y: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
}

export const PointFactory: ArenaFactory<ArenaPoint, PointFactoryParams> = {
  createInstance: (params: PointFactoryParams): ArenaPoint => {
    return { ...params, srs: params.srs ?? DEFAULT_SRS.code }
  },
}
