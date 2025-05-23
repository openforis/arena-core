import { AppInfo } from '../app'
import { Node } from '../node'
import { Validation } from '../validation'

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
