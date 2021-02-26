import { ArenaObject } from 'src/common'
import { Labels } from 'src/labels'

export enum CalculationType {
  categorical = 'categorical',
  quantitative = 'quantitative',
}

export enum CalculationPropsAggregateFn {
  avg = 'avg',
  cnt = 'cnt',
  max = 'max',
  med = 'med',
  min = 'min',
  sum = 'sum',
}

export interface CalculationProps {
  aggregateFn: CalculationPropsAggregateFn
  formula: string
  labels: Labels
  type: CalculationType
}

export interface Calculation extends ArenaObject<CalculationProps> {
  index: number
  nodeDefUuid: string
  processingStepUuid: string
  script: string
  temporary: boolean
}
