import { ArenaFactory } from '../common'
import { UUIDs } from '../utils'
import { ArenaChain, ArenaChainProps } from './chain'
import { ValidationFactory } from '../validation'

export const ChainFactory: ArenaFactory<ArenaChain, ArenaChainProps> = {
  createInstance(params?: ArenaChainProps): ArenaChain {
    return {
      uuid: UUIDs.v4(),
      props: params ?? {},
      validation: ValidationFactory.createInstance({}),
    }
  },
}
