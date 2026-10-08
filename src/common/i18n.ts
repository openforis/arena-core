export interface I18n {
  t: (key: string, params?: Record<string, unknown>) => string
  exists: (key: string) => boolean
}
