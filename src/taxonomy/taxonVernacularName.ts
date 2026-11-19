import { ArenaObject } from '../common'

export interface VernacularNameProps {
  lang: string
  name: string
}

export type VernacularName = ArenaObject<VernacularNameProps>

/** Alias of VernacularName, not clashing with the VernacularName modules of the consumers. */
export type ArenaVernacularName = ArenaObject<VernacularNameProps>
