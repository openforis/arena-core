import { Validation } from 'src/validation/index'
import { ArenaObject } from 'src/common'
import { ProcessingStep } from './processingStep'

export interface ChainProps {
  labels: { [key: string]: string }
  descriptions: { [key: string]: string }
  cycles: Array<string>
}

export interface Chain extends ArenaObject<ChainProps> {
  dateCreated: string
  dateModified: string
  dateExecuted: string
  validation: Validation
  statusExec: string
  scriptCommon: string
  temporary: boolean
  processingSteps: Array<ProcessingStep>
}
