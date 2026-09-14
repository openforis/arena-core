import { LanguageCode } from '../language'

export interface ExpressionContext {
  object?: any
  evaluateToNode?: boolean
  includeAnalysis?: boolean
  /**
   * client timezone offset in minutes as returned by the Date.getTimezoneOffset function
   */
  timezoneOffset?: number
  /**
   * language selected in the client app, used by language-aware expression functions (e.g. numberToWords)
   */
  lang?: LanguageCode
}
