import { CategoryItem } from '../category'
import { Taxon } from '../taxonomy'

export interface NodeMeta {
  childApplicability?: { [uuid: string]: boolean }
  h?: string[]
  hCode?: string[]
  defaultValueApplied?: boolean
}

export interface Node {
  dateCreated?: string
  dateModified?: string
  id?: string
  meta?: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: CategoryItem | Taxon
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
