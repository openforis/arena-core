import { NodeDef, NodeDefLayout, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface NodeDefEntityChildPosition {
  h?: number
  i: string
  moved?: boolean
  static?: number
  w?: number
  x: number
  y: number
}

export type NodeDefEntityLayoutChildItem = NodeDefEntityChildPosition | string

export interface NodeDefEntityProps extends NodeDefPropsWithLayout<NodeDefEntityLayout> {
  enumerate?: boolean
}

export enum NodeDefEntityRenderType {
  form = 'form',
  table = 'table',
}

export interface NodeDefEntityLayout extends NodeDefLayout {
  columnsNo?: number
  indexChildren?: string[] // sorted children pages uuids
  layoutChildren?: NodeDefEntityLayoutChildItem[] | undefined
  pageUuid?: string
  renderType: NodeDefEntityRenderType
}

export type NodeDefEntity = NodeDef<NodeDefType.entity, NodeDefEntityProps>
