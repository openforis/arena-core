import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefDecimalProps extends NodeDefProps {
  maxNumberDecimalDigits: number
}

export type NodeDefDecimal = NodeDef<NodeDefType.decimal, NodeDefDecimalProps>
