import { Factory } from '../common'
import { UUIDs } from '../utils'
import { Chain, ChainProps } from './chain'
import { ValidationFactory } from '../validation'

export const ChainFactory: Factory<Chain, ChainProps> = {
  createInstance(params?: ChainProps): Chain {
    return {
      uuid: UUIDs.v4(),
      props: params ?? {},
      validation: ValidationFactory.createInstance({}),
    }
  },
}
