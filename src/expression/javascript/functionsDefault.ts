import { Objects } from '../../utils'
import { ExpressionContext } from '../context'

import { ExpressionFunction } from '../function'

export const functionsDefault: Array<ExpressionFunction<ExpressionContext>> = [
  {
    name: 'isEmpty',
    minArity: 1,
    maxArity: 1,
    executor: () => async (value: any): Promise<boolean> => Objects.isEmpty(value),
  },
]
