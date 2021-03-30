import { NodeDef, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface NodeDefCodeLayout {
  renderType: 'dropdown' | 'checkbox'
}

export interface NodeDefCodeProps extends NodeDefPropsWithLayout<NodeDefCodeLayout> {
  categoryUuid: string
  parentCodeDefUuid?: string
}

export type NodeDefCode = NodeDef<NodeDefType.code, NodeDefCodeProps>
