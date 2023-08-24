import { Objects, UUIDs } from '../../utils'
import { ExpressionContext } from '../context'

import { ExpressionFunction } from '../function'

export const functionsDefault: { [key: string]: ExpressionFunction<ExpressionContext> } = {
  isEmpty: {
    minArity: 1,
    maxArity: 1,
    executor: () => (value: any) => Objects.isEmpty(value),
  },
  uuid: {
    minArity: 0,
    maxArity: 0,
    executor: () => () => UUIDs.v4(),
  },
}
