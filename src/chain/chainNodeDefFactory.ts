import { Factory } from '../common'
import { UUIDs } from '../utils'
import { ChainNodeDef } from './chainNodeDef'

type ChainNodeDefCreateParams = {
  chainUuid: string
  nodeDefUuid: string
}

export const ChainNodeDefFactory: Factory<ChainNodeDef, ChainNodeDefCreateParams> = {
  createInstance(params: ChainNodeDefCreateParams): ChainNodeDef {
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
