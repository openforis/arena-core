import { ChainNodeDef, ChainNodeDefFactory, ChainNodeDefService } from '../../chain'

export const chainNodeDefMock: ChainNodeDef = ChainNodeDefFactory.createInstance({
  chainUuid: 'chainUuid',
  nodeDefUuid: 'nodeDefUuid',
})

export class ChainNodeDefServiceMock implements ChainNodeDefService {
  count(): Promise<{ [p: string]: number }> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<Array<ChainNodeDef>> {
    return Promise.resolve([chainNodeDefMock])
  }

  update(): Promise<ChainNodeDef> {
    throw new Error('Not implemented')
  }
}
