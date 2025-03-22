import { AppInfo } from '../app'
import { Node } from '../node'
import { Validation } from '../validation'
import { InternalIdCache } from './internalIdCache'

export const RECORD_STEP_DEFAULT = '1'

export const steps = ['entry', 'cleansing', 'analysis']

interface NodeUuidsPresence {
  [key: string]: boolean
}

export interface RecordNodesIndex {
  /**
   * uuid of root entity
   */
  nodeRootUuid?: string
  /**
   * node uuids by parent entity uuid and child def uuid
   */
  nodesByParentAndChildDef?: { [key: string]: { [key: string]: NodeUuidsPresence } }
  /**
   * node uuids by node def uuid
   */
  nodesByDef?: { [key: string]: NodeUuidsPresence }
  /**
   * Code attribute uuids by ancenstor code attribute uuid
   */
  nodeCodeDependents?: { [key: string]: NodeUuidsPresence }

  internalIdCache?: InternalIdCache
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
  nodes?: { [uuid: string]: Node }
  ownerName: string
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
