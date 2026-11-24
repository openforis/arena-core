export interface ArenaLogger {
  isDebugEnabled(): boolean

  isInfoEnabled(): boolean

  isWarnEnabled(): boolean

  isErrorEnabled(): boolean

  debug(...msgs: unknown[]): void

  info(...msgs: unknown[]): void

  warn(...msgs: unknown[]): void

  error(...msgs: unknown[]): void
}
