import { ArenaObject } from 'src/common'

export interface VernacularNameProps {
  lang: string
  name: string
}

export type VernacularName = ArenaObject<VernacularNameProps>
