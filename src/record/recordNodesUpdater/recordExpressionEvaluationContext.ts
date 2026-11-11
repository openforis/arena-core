import { User } from '../../auth'
import { LanguageCode } from '../../language'
import { AreaOfInterestProvider } from '../../nodeDefExpressionEvaluator/areaOfInterestProvider'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey } from '../../survey'
import type { ArenaRecord } from '../record'

export interface RecordExpressionEvaluationContext {
  user: User
  survey: Survey
  record: ArenaRecord
  prevCycleRecord?: ArenaRecord
  timezoneOffset?: number
  lang?: LanguageCode
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  areaOfInterestProvider?: AreaOfInterestProvider
  sideEffect?: boolean
}

/**
 * Params read by the record expression evaluator (the evaluation context without the update options).
 */
export type RecordExpressionEvaluationParams = Omit<RecordExpressionEvaluationContext, 'sideEffect'>

// every key of RecordExpressionEvaluationParams must be listed here (checked by the compiler)
const evaluationParamsKeysMap: { [key in keyof RecordExpressionEvaluationParams]-?: true } = {
  user: true,
  survey: true,
  record: true,
  prevCycleRecord: true,
  timezoneOffset: true,
  lang: true,
  categoryItemProvider: true,
  taxonProvider: true,
  areaOfInterestProvider: true,
}

const evaluationParamsKeys = Object.keys(evaluationParamsKeysMap) as (keyof RecordExpressionEvaluationParams)[]

/**
 * Extracts the params needed by the record expression evaluator, to forward them all (and only them).
 * @param params - Params including the evaluation ones.
 * @returns The evaluation params.
 */
const extractEvaluationParams = (params: RecordExpressionEvaluationParams): RecordExpressionEvaluationParams => {
  const result: Partial<RecordExpressionEvaluationParams> = {}
  for (const key of evaluationParamsKeys) {
    if (params[key] !== undefined) {
      ;(result as any)[key] = params[key]
    }
  }
  return result as RecordExpressionEvaluationParams
}

export const RecordExpressionEvaluationContexts = {
  extractEvaluationParams,
}
