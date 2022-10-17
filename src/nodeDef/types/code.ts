import { NodeDef, NodeDefLayout, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface NodeDefCodeLayout extends NodeDefLayout {
  renderType: 'dropdown' | 'checkbox'
}

export interface NodeDefCodeProps extends NodeDefPropsWithLayout<NodeDefCodeLayout> {
  categoryUuid: string
  parentCodeDefUuid?: string
}

export type NodeDefCode = NodeDef<NodeDefType.code, NodeDefCodeProps>
