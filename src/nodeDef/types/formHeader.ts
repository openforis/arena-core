import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export enum FormHeaderColor {
  blue = 'blue',
  green = 'green',
  orange = 'orange',
  red = 'red',
  yellow = 'yellow',
}

export interface ArenaNodeDefFormHeaderProps extends ArenaNodeDefProps {
  headerColor: FormHeaderColor
}

export type ArenaNodeDefFormHeader = ArenaNodeDef<NodeDefType.formHeader, ArenaNodeDefFormHeaderProps>
