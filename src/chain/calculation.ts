import { ArenaObject } from '../common'
import { Labels } from '../language'

export enum CalculationType {
  categorical = 'categorical',
  quantitative = 'quantitative',
}

export enum CalculationAggregateFn {
  avg = 'avg',
  cnt = 'cnt',
  max = 'max',
  med = 'med',
  min = 'min',
  sum = 'sum',
}

export interface CalculationProps {
  aggregateFn: CalculationAggregateFn
  formula: string
  labels: Labels
  type: CalculationType
}

export interface Calculation extends ArenaObject<CalculationProps> {
  index: number
  nodeDefUuid?: string
  processingStepUuid?: string
  script?: string
  temporary?: boolean
}
