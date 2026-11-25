export type ArenaAppPlatform = 'android' | 'ios' | 'web'

export interface ArenaAppInfo {
  /**
   * Id of the app (e.g. "arena" for Arena, "am" for Arena Mobile)
   */
  appId: string
  version: string
  platform?: ArenaAppPlatform
}
