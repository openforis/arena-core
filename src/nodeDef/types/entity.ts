import { ArenaNodeDef, ArenaNodeDefLayout, ArenaNodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefEntityChildPosition {
  h?: number
  i: string
  maxH?: number
  minH?: number
  minW?: number
  moved?: boolean
  static?: boolean
  w?: number
  x: number
  y: number
}

export type ArenaNodeDefEntityLayoutChildItem = ArenaNodeDefEntityChildPosition | string

export type ArenaNodeDefPrintOrientation = 'portrait' | 'landscape'

export interface ArenaNodeDefEntityProps extends ArenaNodeDefPropsWithLayout<ArenaNodeDefEntityLayout> {
  // Applies only to multiple entities; when true, missing repetitions up to min count are auto-created.
  autoCreateMinCountItems?: boolean
  enumerate?: boolean
  /** When set, printable export uses this orientation for the entity's print section. */
  printOrientation?: ArenaNodeDefPrintOrientation
}

export enum NodeDefEntityRenderType {
  form = 'form',
  table = 'table',
}

export interface ArenaNodeDefEntityLayout extends ArenaNodeDefLayout {
  columnsNo?: number
  indexChildren?: string[] // sorted children pages uuids
  layoutChildren?: ArenaNodeDefEntityLayoutChildItem[]
  pageUuid?: string
  renderType: NodeDefEntityRenderType
}

export type ArenaNodeDefEntity = ArenaNodeDef<NodeDefType.entity, ArenaNodeDefEntityProps>
