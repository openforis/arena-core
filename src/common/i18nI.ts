export interface I18nI {
  t: (key: string) => string
  exists: (key: string) => boolean
}
