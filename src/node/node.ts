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
  childApplicability?: { [nodeDefUuid: string]: boolean }
  /**
   * Whether the node children (by definition UUID) are editable (true) or read-only (false).
   * If not defined, the children are editable by default.
   */
  cEdit?: { [nodeDefUuid: string]: boolean }
  /**
   * Maximum number of children (by definition UUID) for the node.
   */
  childrenMaxCount?: { [nodeDefUuid: string]: number }
  /**
   * Minimum number of children (by definition UUID) for the node.
   */
  childrenMinCount?: { [nodeDefUuid: string]: number }
  /**
   * Whether the node children (by definition UUID) are visible (true) or hidden (false).
   * If not defined, the children are visible by default.
   */
  cVis?: { [nodeDefUuid: string]: boolean }
  /**
   * Hierarchy of ancestor node internal IDs.
   */
  h?: number[]
  /**
   * Hierarchy of code attribute ancestor node internal IDs (according to the parent code defs specified).
   */
  hCode?: number[]
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
  /**
   * ID used when node is stored (unique relatively to the entire survey; e.g. DB table PK).
   */
  id?: number
  /**
   * Internal ID (unique relatively to the record).
   */
  iId: number
  meta?: NodeMeta
  nodeDefUuid: string
  /**
   * Parent node internal ID.
   */
  pIId?: number
  recordUuid: string
  refData?: NodeRefData
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
  [internalId: number]: Node
}
