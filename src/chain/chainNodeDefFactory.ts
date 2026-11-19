import { ArenaFactory } from '../common'
import { UUIDs } from '../utils'
import { ArenaChainNodeDef } from './chainNodeDef'

type ChainNodeDefCreateParams = {
  chainUuid: string
  nodeDefUuid: string
}

export const ChainNodeDefFactory: ArenaFactory<ArenaChainNodeDef, ChainNodeDefCreateParams> = {
  createInstance(params: ChainNodeDefCreateParams): ArenaChainNodeDef {
    const { chainUuid, nodeDefUuid } = params

    return {
      chainUuid,
      index: 0,
      nodeDefUuid,
      props: { active: true },
      uuid: UUIDs.v4(),
    }
  },
}
