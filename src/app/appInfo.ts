export type ArenaAppPlatform = 'android' | 'ios' | 'web'

export interface ArenaAppInfo {
  /**
   * Id of the app (e.g. "arena" or "arena-mobile")
   */
  appId: string
  version: string
  platform?: ArenaAppPlatform
}
