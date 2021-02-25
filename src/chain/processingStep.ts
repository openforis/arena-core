import { ArenaObject } from 'src/common'
import { ProcessingStepCalculation } from './processingStepCalculation'

export interface ProcessingStepProps {
  entityUuid?: string
  categoryUuid?: string
  virtual: boolean
  variablesPreviousStep: string
}

export interface ProcessingStep extends ArenaObject<ProcessingStepProps> {
  calculations: Array<ProcessingStepCalculation>
  calculationUuids: Array<string>
  index: number
  processingChainUuid: string
  temporary: boolean
}
