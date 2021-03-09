import { JavascriptExpressionEvaluator } from './evaluator'

type Query = {
  q: string
  r?: any
  e?: boolean
}

const queries: Array<Query> = [
  { q: '1 + 1', r: 2 },
  { q: '3 * 8 - 4', r: 20 },
  // global objects: Array
  { q: 'Array.of(1,2,3)', r: [1, 2, 3] },
  { q: `Array.of('a',2,'c')`, r: ['a', 2, 'c'] },
  // global objects: Boolean
  { q: 'Boolean(1)', r: true },
  { q: `Boolean('value')`, r: true },
  { q: `Boolean('false')`, r: true },
  { q: `Boolean(false)`, r: false },
  // global objects: Date
  { q: 'Math.round(Date.now() / 10000)', r: Math.round(Date.now() / 10000) },
  // global objects: Math
  { q: 'Math.pow(2,3) + 1', r: 9 },
  { q: 'Math.pow(2,3) + 1 > 10', r: false },
  { q: 'Math.pow(2,3) + 1 > 10 - 8', r: true },
  { q: '16 / Math.pow(2, 3) - 2', r: 0 },
  { q: '16 / (Math.pow(2, 3) - 2)', r: 2.6666666666666665 },
  { q: '16 / (Math.pow(2, 3) - 2) == 2.6666666666666665', r: true },
  { q: '3 ** 9', r: 19683 },
  { q: 'Math.log(2)', r: 0.6931471805599453 },
  { q: 'Math.log10(10)', r: 1 },
  { q: 'Math.log10(100) == 2', r: true },
  // global objects: Number
  { q: 'Number.isFinite(1/0)', r: false },
  { q: 'Number.isInteger(12)', r: true },
  { q: 'Number.isInteger(1.23)', r: false },
  { q: 'Number.isNaN(1.23)', r: false },
  // global objects: String
  { q: 'String.fromCharCode(65, 66, 67)', r: 'ABC' },
  { q: 'String(65)', r: '65' },
  // global objects: Unknown object/function
  { q: 'Math.unknownFunc(1)', e: true },
  { q: 'Invalid.func(1)', e: true },
  // custom functions
  { q: `includes(Array.of(1,2,3), 2)`, r: true },
  { q: `includes(Array.of(1,2,3), 4)`, r: false },
  { q: `includes(Array.of('a',2,'c'), 'c')`, r: true },
  { q: `isEmpty('test')`, r: false },
  { q: `isEmpty('')`, r: true },
  { q: 'isEmpty(1)', r: false },
  { q: 'isEmpty(0)', r: false },
]

describe('ExpressionParser test', () => {
  queries.forEach((query: Query) => {
    test(query.q, () => {
      const { q: expression, r: result, e: error = false } = query

      try {
        const res = new JavascriptExpressionEvaluator().evaluate(expression)
        expect(res).toEqual(result)
      } catch (e) {
        if (error) {
          expect(e).toBeDefined()
        } else {
          throw e
        }
      }
    })
  })
})
