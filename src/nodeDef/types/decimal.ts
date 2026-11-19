import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefDecimalProps extends ArenaNodeDefProps {
  maxNumberDecimalDigits: number
}

export type ArenaNodeDefDecimal = ArenaNodeDef<NodeDefType.decimal, ArenaNodeDefDecimalProps>
