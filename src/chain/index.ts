import { Validation } from 'src/validation/index'
import { ArenaObject } from 'src/common'
import { ProcessingStep } from './processingStep'
import { Labels } from 'src/labels/index'

export enum StatusExec {
  error = 'error',
  success = 'success',
  running = 'running',
}

export interface ChainProps {
  cycles: Array<string>
  descriptions: { [key: string]: string }
  labels: Labels
}

export interface Chain extends ArenaObject<ChainProps> {
  dateCreated: string
  dateExecuted: string
  dateModified: string
  processingSteps: Array<ProcessingStep>
  scriptCommon: string
  statusExec: string
  temporary: boolean
  validation: Validation
}
