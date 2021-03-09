import { ExpressionFunction } from '../function'

export const functionsDefault: Array<ExpressionFunction> = [
  {
    name: 'includes',
    minArity: 2,
    maxArity: 2,
    executor: (items: any, value: any) => Array.isArray(items) && items.includes(String(value)),
  },
  { name: 'index', minArity: 1, maxArity: 1, evaluateToNode: true, executor: () => null },
  {
    name: 'isEmpty',
    minArity: 1,
    maxArity: 1,
    executor: (value: any) =>
      value === null ||
      value === '' ||
      (value instanceof Number && Number.isNaN(value)) ||
      (value instanceof Object && Object.entries(value).length === 0) ||
      (Array.isArray(value) && value.length === 0),
  },
  { name: 'parent', minArity: 1, maxArity: 1, evaluateToNode: true, executor: () => null },
]
