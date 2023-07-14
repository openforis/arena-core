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

export interface NodeDefEntityProps extends NodeDefPropsWithLayout<NodeDefEntityLayout> {
  enumerate?: boolean
}

export enum NodeDefEntityRenderType {
  form = 'form',
  table = 'table',
}

export interface NodeDefEntityLayout extends NodeDefLayout {
  columnsNo?: number
  layoutChildren?: Array<NodeDefEntityChildPosition | string>
  pageUuid?: string
  renderType: NodeDefEntityRenderType
}

export type NodeDefEntity = NodeDef<NodeDefType.entity, NodeDefEntityProps>
