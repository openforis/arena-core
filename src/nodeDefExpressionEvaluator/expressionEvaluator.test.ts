import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { NodeDefExpressionEvaluator } from './evaluator'

const { booleanDef, entityDef, integerDef, textDef } = SurveyObjectBuilders

type Query = {
  expression: string
  result?: any
  resultIsNotNodeDef?: boolean // default false
  error?: boolean
  nodeDef?: string
}

const user = createTestAdminUser()
let survey: Survey

const expectToBeNodeDef = (value: any): void => {
  expect(value).toHaveProperty(['props', 'name'])
}

const checkExpressionEvaluateResult = (params: {
  result: any
  expectedResultValue: any
  resultIsNotNodeDef: boolean
}): void => {
  const { result, expectedResultValue, resultIsNotNodeDef } = params

  if (expectedResultValue === null || expectedResultValue === undefined) {
    expect(result).toBe(expectedResultValue)
    return
  }
  expect(result).not.toBeNull()

  if (resultIsNotNodeDef) {
    expect(result).toBe(expectedResultValue)
  } else {
    expectToBeNodeDef(result)
    const nodeDefResult: NodeDef<NodeDefType, NodeDefProps> = result
    expect(nodeDefResult.props.name).toEqual(expectedResultValue)
  }
}

describe('NodeDefExpressionEvaluator', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('accessible'),
        textDef('remarks'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('tree', integerDef('tree_id').key()).multiple()
        ).multiple()
      )
    ).build()
  }, 10000)

  const queries: Query[] = [
    // wrong node def name
    { expression: 'not_existent', error: true },
    // sibling node defs
    { expression: 'accessible', result: 'accessible' },
    // sibling node defs when current node def is specified
    { expression: 'accessible', nodeDef: 'accessible', result: 'accessible' },
    // parent of root entity should be undefined
    { expression: 'parent(cluster)', result: undefined },
    // computed expressions (access node at index)
    { expression: 'plot[0]', result: 'plot' },
    { expression: 'plot[index(parent(plot_id))]', nodeDef: 'plot_id', result: 'plot' },
    // descendant node defs
    { expression: 'plot[0].plot_id', result: 'plot_id' },
    // ancestor properties using parent function
    { expression: 'parent(plot[0]).cluster_id', result: 'cluster_id' },
    { expression: 'parent(parent(plot_id)).accessible', nodeDef: 'plot_id', result: 'accessible' },
    // ancestors properties without using parent function
    { expression: 'cluster_id', nodeDef: 'plot_id', result: 'cluster_id' },
    // global objects
    { expression: 'Math.PI', result: Math.PI, resultIsNotNodeDef: true },
    { expression: 'Number.isFinite(plot[1].plot_id)', result: false, resultIsNotNodeDef: true },
    // sequence expressions
    {
      expression: '(accessible && cluster_id) || (accessible && plot[1].plot_id)',
      result: true,
      resultIsNotNodeDef: true,
    },
    { expression: 'this', nodeDef: 'plot', result: 'plot' },
    { expression: 'parent(this).plot_id', nodeDef: 'plot_id', result: 'plot_id' },
    { expression: 'parent(parent(this)).accessible', nodeDef: 'tree', result: 'accessible' },
    {
      expression: `dateTimeDiff('2025-01-01', '11:00', '2025-01-01', '10:00')`,
      result: 60,
      resultIsNotNodeDef: true,
    },
    {
      expression: `dateTimeDiff('2025-01-02', '11:00', '2025-01-01', '10:10')`,
      result: 1490,
      resultIsNotNodeDef: true,
    },
    // regular exprssions
    { expression: '/[a-z\\s]+/i.test(remarks)', result: true, resultIsNotNodeDef: true },
    // user properties
    { expression: 'userName()', result: 'test', resultIsNotNodeDef: true },
    { expression: 'userEmail()', result: 'test@openforis-arena.org', resultIsNotNodeDef: true },
    { expression: 'userProp("property_1")', result: 'prop_1', resultIsNotNodeDef: true },
  ]

  queries.forEach((query: Query) => {
    const { expression, result, resultIsNotNodeDef = false, error: errorExpected = false, nodeDef } = query
    const expectedResultValue = result instanceof Function ? result() : result
    const testNameSuffix = nodeDef ? ` (nodeDef: ${nodeDef})` : ''

    test(`${expression}${testNameSuffix}`, async () => {
      try {
        const nodeDefCurrent = Surveys.getNodeDefByName({ survey, name: nodeDef ?? 'cluster_id' })

        const result = await new NodeDefExpressionEvaluator().evalExpression({
          user,
          survey,
          expression,
          nodeDef: nodeDefCurrent,
        })

        checkExpressionEvaluateResult({ result, expectedResultValue, resultIsNotNodeDef })
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
