import { Chain, ChainFactory, ChainService } from '../../chain'
import { LanguageCode } from '../../language'

export const chainMock: Chain = ChainFactory.createInstance({ labels: { [LanguageCode.en]: 'Chain' } })

export class ChainServiceMock implements ChainService {
  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<Chain> {
    return Promise.resolve(chainMock)
  }

  getMany(): Promise<Array<Chain>> {
    throw new Error('Not implemented')
  }
}
