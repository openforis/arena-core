import { Objects, UUIDs } from '../../utils'
import { ArenaExpressionContext } from '../context'

import { ArenaExpressionFunction } from '../function'

export const functionsDefault: { [key: string]: ArenaExpressionFunction<ArenaExpressionContext> } = {
  isEmpty: {
    minArity: 1,
    maxArity: 1,
    executor: () => (value: any) => Objects.isEmpty(value),
  },
  isNotEmpty: {
    minArity: 1,
    maxArity: 1,
    executor: () => (value: any) => Objects.isNotEmpty(value),
  },
  uuid: {
    minArity: 0,
    maxArity: 0,
    executor: () => () => UUIDs.v4(),
  },
}
