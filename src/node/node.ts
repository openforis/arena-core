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
  /**
   * Applicability of the node children (by definition UUID). If not defined, the children are applicable by default.
   */
  childApplicability?: { [uuid: string]: boolean }
  /**
   * Whether the node children (by definition UUID) are editable (true) or read-only (false).
   * If not defined, the children are editable by default.
   */
  cEdit?: { [uuid: string]: boolean }
  /**
   * Maximum number of children (by definition UUID) for the node.
   */
  childrenMaxCount?: { [uuid: string]: number }
  /**
   * Minimum number of children (by definition UUID) for the node.
   */
  childrenMinCount?: { [uuid: string]: number }
  /**
   * Whether the node children (by definition UUID) are visible (true) or hidden (false).
   * If not defined, the children are visible by default.
   */
  cVis?: { [uuid: string]: boolean }
  /**
   * Hierarchy of ancestor node UUIDs.
   */
  h?: string[]
  /**
   * Hierarchy of code attribute ancestor UUIDs (according to the parent code defs specified).
   */
  hCode?: string[]
  /**
   * True if the value has been auto-filled from the node default value
   */
  defaultValueApplied?: boolean
  /**
   * True if the value has been auto-filled from the user group qualifier
   */
  qualifierValueApplied?: boolean
}

export interface NodeRefData {
  categoryItem?: CategoryItem
  taxon?: Taxon
}

export interface Node {
  dateCreated?: string
  dateModified?: string
  id?: number
  meta?: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: NodeRefData
  uuid: string
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
