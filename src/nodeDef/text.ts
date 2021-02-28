import { NodeDef, NodeDefProps, NodeDefType } from './nodeDef'

export interface NodeDefTextProps extends NodeDefProps {
  textTransform: 'none' | 'capitalize' | 'lowercase' | 'uppercase'
}

export type NodeDefText = NodeDef<NodeDefType.text, NodeDefTextProps>
