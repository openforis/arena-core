import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export enum FormHeaderColor {
  blue = 'blue',
  green = 'green',
  orange = 'orange',
  red = 'red',
  yellow = 'yellow',
}

export interface NodeDefFormHeaderProps extends NodeDefProps {
  headerColor: FormHeaderColor
}

export type NodeDefFormHeader = NodeDef<NodeDefType.formHeader, NodeDefFormHeaderProps>
