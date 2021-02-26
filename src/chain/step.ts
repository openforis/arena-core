import { ArenaObject } from 'src/common'
import { Calculation } from './calculation'

export interface StepProps {
  categoryUuid?: string
  entityUuid?: string
  variablesPreviousStep: string
  virtual: boolean
}

export interface Step extends ArenaObject<StepProps> {
  calculations: Array<Calculation>
  calculationUuids: Array<string>
  index: number
  processingChainUuid: string
  temporary: boolean
}
