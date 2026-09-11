import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefTimeProps extends NodeDefProps {
  includeSeconds?: boolean
}

export type NodeDefTime = NodeDef<NodeDefType.time, NodeDefTimeProps>
