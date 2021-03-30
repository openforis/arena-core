import { ArenaObject } from '../common'

export interface VernacularNameProps {
  lang: string
  name: string
}

export type VernacularName = ArenaObject<VernacularNameProps>
