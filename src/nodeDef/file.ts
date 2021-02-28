import { NodeDef, NodeDefProps, NodeDefType } from './nodeDef'

export interface NodeDefFileProps extends NodeDefProps {
  fileType?: 'audio' | 'image' | 'video' | 'other'
  maxFileSize?: number
}

export type NodeDefFile = NodeDef<NodeDefType.file, NodeDefFileProps>
