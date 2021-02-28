import { NodeDef, NodeDefProps, NodeDefType } from './nodeDef'

export interface NodeDefBooleanProps extends NodeDefProps {
  labelValue: 'yesNo' | 'trueFalse'
}

export type NodeDefBoolean = NodeDef<NodeDefType.boolean, NodeDefBooleanProps>
