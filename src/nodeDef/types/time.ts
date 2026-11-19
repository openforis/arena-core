import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefTimeProps extends ArenaNodeDefProps {
  includeSeconds?: boolean
}

export type ArenaNodeDefTime = ArenaNodeDef<NodeDefType.time, ArenaNodeDefTimeProps>
