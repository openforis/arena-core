import { ArenaObject } from 'src/common'
import { Calculation } from './calculation'

export interface StepProps {
  categoryUuid?: string
  entityUuid?: string
  variablesPreviousStep?: string
}

export interface Step extends ArenaObject<StepProps> {
  calculations?: Array<Calculation>
  index: number
  processingChainUuid: string
  temporary?: boolean
}
