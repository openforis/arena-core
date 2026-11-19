export interface ArenaLogger {
  isDebugEnabled(): boolean

  isInfoEnabled(): boolean

  isWarnEnabled(): boolean

  isErrorEnabled(): boolean

  debug(...msgs: any[]): void

  info(...msgs: any[]): void

  warn(...msgs: any[]): void

  error(...msgs: any[]): void
}
