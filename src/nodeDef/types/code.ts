import { ArenaNodeDef, ArenaNodeDefLayout, ArenaNodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefCodeLayout extends ArenaNodeDefLayout {
  renderType: 'dropdown' | 'checkbox'
}

export interface ArenaNodeDefCodeProps extends ArenaNodeDefPropsWithLayout<ArenaNodeDefCodeLayout> {
  categoryUuid: string
  parentCodeDefUuid?: string
}

export type ArenaNodeDefCode = ArenaNodeDef<NodeDefType.code, ArenaNodeDefCodeProps>
