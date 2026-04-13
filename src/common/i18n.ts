export interface I18n {
  t: (key: string) => string
  exists: (key: string) => boolean
}
