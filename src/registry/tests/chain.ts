import { ArenaChain, ChainFactory, ArenaChainService } from '../../chain'
import { LanguageCode } from '../../language'

export const chainMock: ArenaChain = ChainFactory.createInstance({ labels: { [LanguageCode.en]: 'Chain' } })

export class ChainServiceMock implements ArenaChainService {
  create(): Promise<ArenaChain> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaChain> {
    return Promise.resolve(chainMock)
  }

  getMany(): Promise<Array<ArenaChain>> {
    throw new Error('Not implemented')
  }

  update(): Promise<ArenaChain> {
    throw new Error('Not implemented')
  }

  delete(): Promise<ArenaChain> {
    throw new Error('Not implemented')
  }
}
