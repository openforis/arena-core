import { ArenaObject } from '../common'
import { ArenaLabels } from '../language'
import { ArenaValidation } from '../validation'

export enum ChainStatusExec {
  error = 'error',
  running = 'running',
  success = 'success',
}

export interface ArenaChainProps {
  cycles?: string[]
  descriptions?: ArenaLabels
  labels?: ArenaLabels
}

export interface ArenaChain extends ArenaObject<ArenaChainProps> {
  dateCreated?: string
  dateExecuted?: string
  dateModified?: string
  scriptCommon?: string
  statusExec?: string
  validation: ArenaValidation
  temporary?: boolean
}
