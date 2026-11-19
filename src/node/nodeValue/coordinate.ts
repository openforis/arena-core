import { NodeValueComposite } from './nodeValueComposite'

export interface ArenaRecordNodeValueCoordinate extends NodeValueComposite {
  srs: string
  x: number
  y: number
}
