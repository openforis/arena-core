import { Validation } from 'src/validation/index'
import { ArenaObject } from 'src/common'
import { Step } from './step'
import { Labels } from 'src/labels/index'

export enum StatusExec {
  error = 'error',
  running = 'running',
  success = 'success',
}

export interface ChainProps {
  cycles: Array<string>
  descriptions: Labels
  labels: Labels
}

export interface Chain extends ArenaObject<ChainProps> {
  dateCreated: string
  dateExecuted: string
  dateModified: string
  processingSteps: Array<Step>
  scriptCommon: string
  statusExec: string
  temporary: boolean
  validation: Validation
}
