import { NodeDef, NodeDefLayout, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface NodeDefEntityChildPosition {
  h: number
  i: string
  w: number
  x: number
  y: number
  moved: boolean
  static: number
}

export interface NodeDefEntityLayout extends NodeDefLayout {
  columnsNo?: number
  layoutChildren?: Array<NodeDefEntityChildPosition | string>
  pageUuid?: string
  renderType: 'form' | 'table'
}

export type NodeDefEntity = NodeDef<NodeDefType.entity, NodeDefPropsWithLayout<NodeDefEntityLayout>>
