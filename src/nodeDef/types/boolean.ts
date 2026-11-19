import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefBooleanProps extends ArenaNodeDefProps {
  labelValue: 'yesNo' | 'trueFalse'
}

export type ArenaNodeDefBoolean = ArenaNodeDef<NodeDefType.boolean, ArenaNodeDefBooleanProps>
