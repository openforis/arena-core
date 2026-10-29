import { describe, test, expect } from '@jest/globals'

import { JavascriptExpressionEvaluator } from './evaluator'

const testsLoadTime = Date.now()

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
  // compare with the time when the test file is loaded: comparing two Date.now() calls could fail on a time boundary
  { expression: `Date.now() >= ${testsLoadTime}`, result: true },
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
  // string concatenation
  { expression: '"a" + "b"', result: 'ab' },
  { expression: '"a" + 1', result: 'a1' },
  // string concatenation with null gives null (like arithmetic operations with null)
  { expression: '"a" + null', result: null },
  { expression: 'null + "a"', result: null },
  { expression: '1 + null', result: null },
  // global objects: Unknown object/function
  { expression: 'Math.unknownFunc(1)', error: true },
  { expression: 'Invalid.func(1)', error: true },
  // native properties/functions
  { expression: `Array.of(1,2,3).length`, result: 3 },
  // native functions of falsy values
  { expression: 'Math.round(0.1).toFixed(1)', result: '0.0' },
  { expression: `''.concat('a')`, result: 'a' },
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
  // regular expressions applied to strings up to the max length
  { expression: `/^a+$/.test('${'a'.repeat(1000)}')`, result: true },
  { expression: `'abc'.search('b')`, result: 1 },
  { expression: `'abc'.match('(b)+').length`, result: 2 },
  // replace and split treat string patterns literally
  { expression: `'${'a'.repeat(1001)}'.replace('(a+)+$', 'b').length`, result: 1001 },
  { expression: `'a(a+)+$b'.split('(a+)+$').length`, result: 2 },
  // properties leading to Object, Function or prototypes are not accessible
  { expression: 'Math.constructor', error: true },
  { expression: `'a'.constructor`, error: true },
  { expression: 'Math.abs.__proto__', error: true },
  { expression: 'Array.prototype', error: true },
  {
    expression:
      'Array.from("a", Math.constructor.getOwnPropertyDescriptor(Math.constructor.getPrototypeOf(Math.abs), "constructor").value("return 1"))',
    error: true,
  },
]

describe('JavascriptExpressionEvaluator test', () => {
  queries.forEach((query: Query) => {
    test(query.expression, async () => {
      const { expression, result: resultExpected, error: errorExpected = false } = query

      const run = async () => {
        const res = await new JavascriptExpressionEvaluator().evaluate(expression)
        expect(res).toEqual(resultExpected)
      }
      if (errorExpected) {
        await expect(run()).rejects.toThrow()
      } else {
        await run()
      }
    })
  })
})

describe('JavascriptExpressionEvaluator regular expressions safety', () => {
  test.each([
    ['/^(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!")', 'expression.unsafeRegularExpression'],
    [`/^a+$/.test('${'a'.repeat(1001)}')`, 'expression.regularExpressionInputTooLong'],
    [`'${'a'.repeat(1001)}'.match(/b/)`, 'expression.regularExpressionInputTooLong'],
    // string patterns are converted into regular expressions by match, matchAll and search
    [`'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'.match('(a+)+$')`, 'expression.unsafeRegularExpression'],
    [`'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'.matchAll('(a+)+$')`, 'expression.unsafeRegularExpression'],
    [`'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'.search('(a+)+$')`, 'expression.unsafeRegularExpression'],
    [`'${'a'.repeat(1001)}'.match('b')`, 'expression.regularExpressionInputTooLong'],
    [`'${'a'.repeat(1001)}'.search('b')`, 'expression.regularExpressionInputTooLong'],
  ])('unsafe regular expression or input %# rejected', async (expression, errorKey) => {
    await expect(new JavascriptExpressionEvaluator().evaluate(expression)).rejects.toMatchObject({ key: errorKey })
  })
})

describe('JavascriptExpressionEvaluator Object and Function access', () => {
  const evaluator = new JavascriptExpressionEvaluator({
    getObject: { minArity: 0, executor: () => () => Object },
    getFunction: { minArity: 0, executor: () => () => Function },
    getDescriptor: { minArity: 0, executor: () => () => ({ value: Function }) },
  })
  test.each([
    `getObject().getOwnPropertyDescriptor(getObject().getPrototypeOf(Math.max), 'constructor').value('return 1').call(null)`,
    `getObject().keys(Math)`,
    `getFunction()('return 1')`,
    `getFunction().call(null, 'return 1')`,
    `getDescriptor().value('return 1')`,
  ])('%s rejected', async (expression) => {
    await expect(evaluator.evaluate(expression)).rejects.toThrow()
  })
})

describe('JavascriptExpressionEvaluator parsed expressions cache', () => {
  test('evaluates correctly the same expressions after many other expressions have been cached', async () => {
    const evaluator = new JavascriptExpressionEvaluator()
    for (let i = 0; i < 1100; i++) {
      expect(await evaluator.evaluate(`${i} + 1`)).toBe(i + 1)
    }
    expect(await evaluator.evaluate('0 + 1')).toBe(1)
    expect(await evaluator.evaluate('1099 + 1')).toBe(1100)
  })
})

describe('JavascriptExpressionEvaluator method call chains', () => {
  test('evaluates the object of a method call chain only once', async () => {
    let calls = 0
    const evaluator = new JavascriptExpressionEvaluator({
      cnt: {
        minArity: 0,
        maxArity: 0,
        executor: () => () => {
          calls++
          return ' Abc '
        },
      },
    })
    expect(await evaluator.evaluate('cnt().trim().toUpperCase().toLowerCase()')).toBe('abc')
    expect(calls).toBe(1)
  })
})
