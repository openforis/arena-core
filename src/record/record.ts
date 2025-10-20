import { AppInfo } from '../app'
import { Node } from '../node'
import { Validation } from '../validation'

export const RECORD_STEP_DEFAULT = '1'

export const steps = ['entry', 'cleansing', 'analysis']

interface NodeUuidsPresence {
  [internalId: number]: boolean
}

export interface RecordNodesIndex {
  /**
   * Root entity internal ID.
   */
  nodeRootId?: number
  /**
   * node uuids by parent entity uuid and child def uuid
   */
  nodesByParentAndChildDef?: { [parentId: number]: { [childDefUuid: string]: NodeUuidsPresence } }
  /**
   * node uuids by node def uuid
   */
  nodesByDef?: { [nodeDefUuid: string]: NodeUuidsPresence }
  /**
   * Code attribute internal IDs by ancenstor code attribute internal ID
   */
  nodeCodeDependents?: { [internalId: number]: NodeUuidsPresence }
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
  nodes?: { [uuid: string]: Node }
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
