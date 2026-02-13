import { AppInfo } from '../app'
import { Node } from '../node'
import { Validation } from '../validation'

export const RECORD_STEP_DEFAULT = '1'

export const steps = ['entry', 'cleansing', 'analysis']

interface NodeIdsPresence {
  [internalId: number]: boolean
}

export interface RecordNodesIndex {
  /**
   * Root entity internal ID.
   */
  nodeRootId?: number
  /**
   * node internal IDs by parent entity internal ID and child def UUID
   */
  nodesByParentAndChildDef?: { [parentId: number]: { [childDefUuid: string]: NodeIdsPresence } }
  /**
   * node internal IDs by node def UUID
   */
  nodesByDef?: { [nodeDefUuid: string]: NodeIdsPresence }
  /**
   * Code attribute internal IDs by ancestor code attribute internal ID
   */
  nodeCodeDependents?: { [internalId: number]: NodeIdsPresence }
}

export interface RecordInfo {
  createdWith?: AppInfo
  updatedWith?: AppInfo
}

export interface Record {
  cycle?: string
  dateCreated?: string
  dateModified?: string
  id?: number
  lastInternalId?: number
  nodes?: { [internalId: number]: Node }
  ownerEmail?: string
  ownerName: string
  ownerRole?: string
  ownerUuid: string
  preview?: boolean
  step: string // in steps
  surveyId?: number
  surveyUuid?: string
  uuid: string
  validation?: Validation

  _nodesIndex?: RecordNodesIndex

  info?: RecordInfo
}
