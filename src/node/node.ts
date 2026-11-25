import { ArenaCategoryItem } from '../category'
import { ArenaTaxon } from '../taxonomy'

export enum RecordNodeKeys {
  meta = 'meta',
  value = 'value',
}

export enum RecordNodeMetaKeys {
  hCode = 'hCode',
}

export interface ArenaRecordNodeMeta {
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
   * Whether the node children (by definition UUID) are required because their "required if" condition is met (true).
   * If not defined, the children are not required by a condition (only true values are stored).
   */
  cReq?: { [uuid: string]: boolean }
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

export interface ArenaRecordNodeRefData {
  categoryItem?: ArenaCategoryItem
  taxon?: ArenaTaxon
}

export interface ArenaRecordNode<V = any> {
  dateCreated?: string
  dateModified?: string
  id?: number
  meta?: ArenaRecordNodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: ArenaRecordNodeRefData
  uuid: string
  value?: V
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

export interface ArenaRecordNodesMap {
  [key: string]: ArenaRecordNode
}
