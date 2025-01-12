import { NodeValueComposite } from './nodeValueComposite'

export interface NodeValueFile extends NodeValueComposite {
  fileName?: string
  fileNameCalculated?: string
  fileSize?: number
  fileUuid: string
}
