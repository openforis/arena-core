import { NodeValueComposite } from './nodeValueComposite'

export interface ArenaRecordNodeValueFile extends NodeValueComposite {
  fileName?: string
  fileNameCalculated?: string
  fileSize?: number
  fileUuid: string
}
