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

export type NodeDefPrintOrientation = 'portrait' | 'landscape'

export interface NodeDefEntityProps extends NodeDefPropsWithLayout<NodeDefEntityLayout> {
  // Applies only to multiple entities; when true, missing repetitions up to min count are auto-created.
  autoCreateMinCountItems?: boolean
  enumerate?: boolean
  /** When set, printable export uses this orientation for the entity's print section. */
  printOrientation?: NodeDefPrintOrientation
}

export enum NodeDefEntityRenderType {
  form = 'form',
  table = 'table',
}

export interface NodeDefEntityLayout extends NodeDefLayout {
  columnsNo?: number
  indexChildren?: string[] // sorted children pages uuids
  layoutChildren?: NodeDefEntityLayoutChildItem[]
  pageUuid?: string
  renderType: NodeDefEntityRenderType
}

export type NodeDefEntity = NodeDef<NodeDefType.entity, NodeDefEntityProps>
