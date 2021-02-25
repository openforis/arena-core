import { ArenaObject } from 'src/common'

export enum ProcessingStepCalculationPropsType {
  quantitative = 'quantitative',
  categorical = 'categorical',
}

export enum ProcessingStepCalculationPropsAggregateFn {
  sum = 'sum',
  avg = 'avg',
  cnt = 'cnt',
  min = 'min',
  max = 'max',
  med = 'med',
}

export interface ProcessingStepCalculationProps {
  labels: { [key: string]: string }
  type: ProcessingStepCalculationPropsType
  aggregateFn: ProcessingStepCalculationPropsAggregateFn
  formula: string
}

export interface ProcessingStepCalculation extends ArenaObject<ProcessingStepCalculationProps> {
  processingStepUuid: string
  nodeDefUuid: string
  index: number
  script: string
  temporary: boolean
}
