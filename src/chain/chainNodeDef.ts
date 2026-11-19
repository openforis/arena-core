import { ArenaObject } from '../common'

export interface ArenaChainNodeDefProps {
  active: boolean
}

export interface ArenaChainNodeDef extends ArenaObject<ArenaChainNodeDefProps> {
  chainUuid: string
  index: number
  nodeDefUuid: string
  script?: string
}
