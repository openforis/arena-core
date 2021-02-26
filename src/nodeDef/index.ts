import { ArenaObject } from 'src/common'
import { Labels } from 'src/labels'

export enum NodeDefType {
  boolean = 'boolean',
  code = 'code',
  coordinate = 'coordinate',
  date = 'date',
  decimal = 'decimal',
  entity = 'entity',
  file = 'file',
  integer = 'integer',
  taxon = 'taxon',
  text = 'text',
  time = 'time',
}

export interface LayoutChildren {
  h: number
  i: string
  w: number
  x: number
  y: number
}
export interface LayoutProps {
  pageUuid: string
  renderType: string
  layoutChildren: LayoutChildren[]
}

export interface Layout {
  [key: number]: LayoutProps
}

export interface Meta {
  h: Array<string>
}

export interface PropsAdvanced {}

export interface PropsAdvancedDraft {}

export interface NodeDefProps {
  name: string
  cycles: string[]
  labels: Labels
  layout: Layout
  multiple: boolean
}

export interface NodeDef extends ArenaObject<NodeDefProps> {
  analysis: boolean
  dateCreated: string
  dateModified: string
  deleted: boolean
  draft: boolean
  id: string
  meta: Meta
  parentUuid?: any
  type: NodeDefType
  propsAdvanced: PropsAdvanced
  propsAdvancedDraft: PropsAdvancedDraft
  published: boolean
  virtual: boolean
}

export interface NodeDefs {
  [key: string]: NodeDef
}
