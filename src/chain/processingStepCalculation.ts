import { ArenaObject } from 'src/common'

export interface ProcessingStepCalculationProps {
  labels: { [key: string]: string }
}

export interface ProcessingStepCalculation extends ArenaObject<ProcessingStepCalculationProps> {
  processingStepUuid: string
  nodeDefUuid: string
  index: number
  script: string
}
