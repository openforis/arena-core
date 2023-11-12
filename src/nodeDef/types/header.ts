import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export enum HeaderColor {
  blue = 'blue',
  green = 'green',
  orange = 'orange',
  red = 'red',
  yellow = 'yellow',
}
export interface NodeDefHeaderProps extends NodeDefProps {
  headerColor: HeaderColor
}

export type NodeDefHeader = NodeDef<NodeDefType.formHeader, NodeDefHeaderProps>
