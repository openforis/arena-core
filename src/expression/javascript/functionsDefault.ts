import { ExpressionFunction } from '../function'

export const functionsDefault: Array<ExpressionFunction> = [
  {
    name: 'isEmpty',
    minArity: 1,
    maxArity: 1,
    executor: (value: any) =>
      value === null ||
      value === '' ||
      Number.isNaN(value) ||
      (value instanceof Object && Object.entries(value).length === 0) ||
      (Array.isArray(value) && value.length === 0),
  },
]
