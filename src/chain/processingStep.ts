import { ArenaObject } from 'src/common'

export interface ProcessingStepProps {
    entityUuid: string
    categoryUuid?: string
}

export interface ProcessingStep extends ArenaObject<ProcessingStepProps> {
  entityUuid?: string
  categoryUuid?: string
  virtual: boolean
  variablesPreviousStep: string
}
