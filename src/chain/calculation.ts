import { ArenaObject } from 'src/common'

export enum CalculationPropsType {
  quantitative = 'quantitative',
  categorical = 'categorical',
}

export enum CalculationPropsAggregateFn {
  sum = 'sum',
  avg = 'avg',
  cnt = 'cnt',
  min = 'min',
  max = 'max',
  med = 'med',
}

export interface CalculationProps {
  labels: { [key: string]: string }
  type: CalculationPropsType
  aggregateFn: CalculationPropsAggregateFn
  formula: string
}

export interface Calculation extends ArenaObject<CalculationProps> {
  processingStepUuid: string
  nodeDefUuid: string
  index: number
  script: string
  temporary: boolean
}
