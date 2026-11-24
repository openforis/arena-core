import { NodeValueComposite } from './nodeValueComposite'

export interface ArenaRecordNodeValueCoordinate extends NodeValueComposite {
  srs: string
  x: number
  y: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
}
