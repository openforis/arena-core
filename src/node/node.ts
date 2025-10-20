import { CategoryItem } from '../category'
import { Taxon } from '../taxonomy'

export enum NodeKeys {
  meta = 'meta',
  value = 'value',
}

export enum NodeMetaKeys {
  h = 'h',
}

export interface NodeMeta {
  childApplicability?: { [uuid: string]: boolean }
  childrenMaxCount?: { [uuid: string]: number }
  childrenMinCount?: { [uuid: string]: number }
  h?: string[]
  hCode?: string[]
  defaultValueApplied?: boolean
}

export interface NodeRefData {
  categoryItem?: CategoryItem
  taxon?: Taxon
}

export interface Node {
  dateCreated?: string
  dateModified?: string
  /**
   * ID used when node is stored (unique relatively to the entire survey; e.g. DB table PK).
   */
  id?: number
  /**
   * Internal ID (unique relatively to the record).
   */
  iId?: number
  meta?: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  /**
   * Parent node internal ID.
   */
  pIId?: number
  recordUuid: string
  refData?: NodeRefData
  uuid?: string
  value?: any
  placeholder?: boolean
  surveyUuid?: string

  // transient status variables
  /**
   * Record node has been created but not persisted yet.
   */
  created?: boolean
  /**
   * Record node has been deleted.
   */
  deleted?: boolean
  /**
   * Record node has been modified but not persisted yet.
   */
  updated?: boolean
}

export interface NodesMap {
  [key: string]: Node
}
