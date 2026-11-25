import { ArenaAppInfo } from './appInfo'

const appIds = {
  arena: 'arena',
  arenaMobile: 'am',
  arenaMobileV1: 'arena-mobile', // first version of Arena Mobile, deprecated
} as const

const labelsByAppId: { [appId: string]: string } = {
  [appIds.arena]: 'Arena',
  [appIds.arenaMobile]: 'Arena Mobile',
  [appIds.arenaMobileV1]: 'Arena Mobile',
}

/**
 * Returns the label of the app with the specified id (e.g. "Arena", "Arena Mobile"); the id itself if unknown.
 */
const getAppIdLabel = (appId: string): string => labelsByAppId[appId] ?? appId

/**
 * Returns the label of the app (see getAppIdLabel), or undefined if the app info is not specified.
 */
const getLabel = (appInfo: ArenaAppInfo | undefined): string | undefined =>
  appInfo ? getAppIdLabel(appInfo.appId) : undefined

export const AppInfos = {
  appIds,
  getAppIdLabel,
  getLabel,
}
