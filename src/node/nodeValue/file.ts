import { NodeValueComposite } from './nodeValueComposite'

export interface NodeValueFile extends NodeValueComposite {
  fileName?: string
  fileSize?: number
  fileUuid: string
}
