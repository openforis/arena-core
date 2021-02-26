import { ArenaObject } from 'src/common'
import { ProcessingStepCalculation } from './processingStepCalculation'

export interface StepProps {
  categoryUuid?: string
  entityUuid?: string
  variablesPreviousStep: string
  virtual: boolean
}

export interface Step extends ArenaObject<StepProps> {
  calculations: Array<ProcessingStepCalculation>
  calculationUuids: Array<string>
  index: number
  processingChainUuid: string
  temporary: boolean
}
