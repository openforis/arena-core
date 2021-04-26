import { ArenaObject } from '../common'
import { Labels } from '../language'

export interface ChainNodeDefAggregateProps {
  alias: Labels
}

export interface ChainNodeDefAggregate extends ArenaObject<ChainNodeDefAggregateProps> {
  chainUuid: string
  nodeDefUuid: string
  formula: string
}
