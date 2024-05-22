export interface ExpressionContext {
  object?: any
  evaluateToNode?: boolean
  includeAnalysis?: boolean
  /**
   * client timezone offset in minutes as returned by the Date.getTimezoneOffset function
   */
  timezoneOffset?: number
}
