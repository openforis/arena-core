import { ArenaAppInfo } from '../../app'
import { ArenaUser } from '../../auth'
import { LanguageCode } from '../../language'
import { ArenaAreaOfInterestProvider } from '../../nodeDefExpressionEvaluator/areaOfInterestProvider'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaTaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { ArenaSurvey } from '../../survey'
import type { ArenaRecord } from '../record'

export interface ArenaRecordExpressionEvaluationContext {
  user: ArenaUser
  survey: ArenaSurvey
  record: ArenaRecord
  prevCycleRecord?: ArenaRecord
  timezoneOffset?: number
  lang?: LanguageCode
  /**
   * Info about the app running the update: expressions using the app info functions (appId, appIdLabel, appVersion, appPlatform)
   * are evaluated again when the record is updated with a different app (see RecordUpdater.updateAppInfoDependents)
   */
  appInfo?: ArenaAppInfo
  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
  areaOfInterestProvider?: ArenaAreaOfInterestProvider
  sideEffect?: boolean
}

/**
 * Params read by the record expression evaluator (the evaluation context without the update options).
 */
export type RecordExpressionEvaluationParams = Omit<ArenaRecordExpressionEvaluationContext, 'sideEffect'>

// every key of RecordExpressionEvaluationParams must be listed here (checked by the compiler)
const evaluationParamsKeysMap: { [key in keyof RecordExpressionEvaluationParams]-?: true } = {
  user: true,
  survey: true,
  record: true,
  prevCycleRecord: true,
  timezoneOffset: true,
  lang: true,
  appInfo: true,
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
