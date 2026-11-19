import { ArenaChainNodeDef, ChainNodeDefFactory, ArenaChainNodeDefService } from '../../chain'

export const chainNodeDefMock: ArenaChainNodeDef = ChainNodeDefFactory.createInstance({
  chainUuid: 'chainUuid',
  nodeDefUuid: 'nodeDefUuid',
})

export class ChainNodeDefServiceMock implements ArenaChainNodeDefService {
  count(): Promise<{ [p: string]: number }> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<Array<ArenaChainNodeDef>> {
    return Promise.resolve([chainNodeDefMock])
  }

  update(): Promise<ArenaChainNodeDef> {
    throw new Error('Not implemented')
  }

  updateIndexes(): Promise<void> {
    throw new Error('Not implemented')
  }
}
