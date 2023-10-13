import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export enum NodeDefFileType {
  audio = 'audio',
  image = 'image',
  video = 'video',
  other = 'other',
}

export interface NodeDefFileProps extends NodeDefProps {
  fileType?: NodeDefFileType
  maxFileSize?: number
}

export type NodeDefFile = NodeDef<NodeDefType.file, NodeDefFileProps>
