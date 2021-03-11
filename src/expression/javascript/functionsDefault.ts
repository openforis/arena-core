import * as Objects from '../../utils/objects'

import { ExpressionFunction } from '../function'

export const functionsDefault: Array<ExpressionFunction> = [
  {
    name: 'isEmpty',
    minArity: 1,
    maxArity: 1,
    executor: (value: any) => Objects.isEmpty(value),
  },
]
