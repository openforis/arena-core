import { NodeValueComposite } from './nodeValueComposite'

export interface NodeValueCoordinate extends NodeValueComposite {
  srs: string
  x: number
  y: number
}
