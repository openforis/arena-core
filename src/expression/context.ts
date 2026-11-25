import { ArenaAppInfo } from '../app'
import { LanguageCode } from '../language'

export interface ArenaExpressionContext {
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
  /**
   * info about the app running the evaluation (used by the appId, appIdLabel, appVersion and appPlatform expression functions)
   */
  appInfo?: ArenaAppInfo
}
