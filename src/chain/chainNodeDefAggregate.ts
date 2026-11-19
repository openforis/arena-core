import { ArenaObject } from '../common'
import { ArenaLabels } from '../language'

export interface ArenaChainNodeDefAggregateProps {
  alias: ArenaLabels
}

export interface ArenaChainNodeDefAggregate extends ArenaObject<ArenaChainNodeDefAggregateProps> {
  chainUuid: string
  nodeDefUuid: string
  formula: string
}
