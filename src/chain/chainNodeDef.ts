import { ArenaObject } from '../common'

export interface ChainNodeDefProps {
  active: boolean
}

export interface ChainNodeDef extends ArenaObject<ChainNodeDefProps> {
  chainUuid: string
  index: number
  nodeDefUuid: string
  script: string
}
