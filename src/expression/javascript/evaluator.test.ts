import { JavascriptExpressionEvaluator } from './evaluator'

type Query = {
  expression: string
  result?: any
  error?: boolean
}

const queries: Query[] = [
  { expression: '1 + 1', result: 2 },
  { expression: '3 * 8 - 4', result: 20 },
  { expression: '"1" + "1"', result: '11' },
  { expression: '"1" + 2', result: '12' },
  { expression: '1 + "2"', result: '12' },
  // global objects: Array
  { expression: 'Array.of(1,2,3)', result: [1, 2, 3] },
  { expression: `Array.of('a',2,'c')`, result: ['a', 2, 'c'] },
  // global objects: Boolean
  { expression: 'Boolean(1)', result: true },
  { expression: `Boolean('value')`, result: true },
  { expression: `Boolean('false')`, result: true },
  { expression: `Boolean(false)`, result: false },
  // global objects: Date
  { expression: 'Math.round(Date.now() / 10000)', result: Math.round(Date.now() / 10000) },
  // global objects: Math
  { expression: 'Math.pow(2,3) + 1', result: 9 },
  { expression: 'Math.pow(2,3) + 1 > 10', result: false },
  { expression: 'Math.pow(2,3) + 1 > 10 - 8', result: true },
  { expression: '16 / Math.pow(2, 3) - 2', result: 0 },
  { expression: '16 / (Math.pow(2, 3) - 2)', result: 2.6666666666666665 },
  { expression: '16 / (Math.pow(2, 3) - 2) == 2.6666666666666665', result: true },
  { expression: '3 ** 9', result: 19683 },
  { expression: 'Math.log(2)', result: 0.6931471805599453 },
  { expression: 'Math.log10(10)', result: 1 },
  { expression: 'Math.log10(100) == 2', result: true },
  // global objects: Number
  { expression: 'Number.isFinite(1/0)', result: false },
  { expression: 'Number.isInteger(12)', result: true },
  { expression: 'Number.isInteger(1.23)', result: false },
  { expression: 'Number.isNaN(1.23)', result: false },
  // global objects: String
  { expression: 'String.fromCharCode(65, 66, 67)', result: 'ABC' },
  { expression: 'String(65)', result: '65' },
  // global objects: Unknown object/function
  { expression: 'Math.unknownFunc(1)', error: true },
  { expression: 'Invalid.func(1)', error: true },
  // native properties/functions
  { expression: `Array.of(1,2,3).length`, result: 3 },
  { expression: `Array.of(1,2,3).includes(2)`, result: true },
  { expression: `Array.of('a','b','c').includes('a')`, result: true },
  { expression: `Array.of('a','b','c').includes('d')`, result: false },
  // accessing array with index
  { expression: `Array.of('a','b','c')[1]`, result: 'b' },
  { expression: `Array.of('a','b','c')[4]`, result: undefined },
  // custom functions
  { expression: `isEmpty('test')`, result: false },
  { expression: `isEmpty('')`, result: true },
  { expression: 'isEmpty(1)', result: false },
  { expression: 'isEmpty(0)', result: false },
  // custom functions (uuid)
  { expression: 'uuid().length == 36', result: true },
  {
    expression: '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid())',
    result: true,
  },
]

describe('JavascriptExpressionEvaluator test', () => {
  queries.forEach((query: Query) => {
    test(query.expression, async () => {
      const { expression, result: resultExpected, error: errorExpected = false } = query

      try {
        const res = await new JavascriptExpressionEvaluator().evaluate(expression)
        expect(res).toEqual(resultExpected)
      } catch (error) {
        if (errorExpected) {
          expect(error).toBeDefined()
        } else {
          throw error
        }
      }
    })
  })
})
