import { ArenaObject } from '../common'
import { Labels } from '../language'
import { Validation } from '../validation'

export enum ChainStatusExec {
  error = 'error',
  running = 'running',
  success = 'success',
}

export interface ChainProps {
  descriptions?: Labels
  labels?: Labels
}

export interface Chain extends ArenaObject<ChainProps> {
  dateCreated?: string
  dateExecuted?: string
  dateModified?: string
  scriptCommon?: string
  statusExec?: string
  validation: Validation
  temporary?: boolean
}
