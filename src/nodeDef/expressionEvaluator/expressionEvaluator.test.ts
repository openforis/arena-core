import { NodeDef, NodeDefExpressionEvaluator, NodeDefProps, NodeDefType } from '..'
import { UserFactory } from '../../auth'
import { Survey, Surveys } from '../../survey'
import { booleanDef, entityDef, integerDef, SurveyBuilder } from '../../tests/builder/surveyBuilder'
import { NodeDefs } from '../nodeDefs'
import { NodeDefExpressionContext } from './context'

type Query = {
  expression: string
  result?: any
  error?: boolean
  nodeDef?: string
}

let survey: Survey

const expectToBeNodeDef = (value: any): void => {
  expect(value).toHaveProperty(['props', 'name'])
}

describe('NodeDefExpressionEvaluator', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@arena.org', name: 'test' })

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('accessible'),
        entityDef('plot', integerDef('plot_id').key()).multiple()
      )
    ).build()
  }, 10000)

  const queries: Query[] = [
    // wrong node def name
    { expression: 'not_existent', result: undefined },
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
  ]

  queries.forEach((query: Query) => {
    const { expression, result, error: errorExpected = false, nodeDef } = query
    const expectedResultValue = result instanceof Function ? result() : result

    test(`${expression}${nodeDef ? ` (nodeDef: ${nodeDef})` : ''}`, () => {
      try {
        const nodeDefCurrent = nodeDef
          ? Surveys.getNodeDefByName({ survey, name: nodeDef })
          : Surveys.getNodeDefRoot({ survey })

        const nodeDefContext = NodeDefs.isRoot(nodeDefCurrent)
          ? nodeDefCurrent
          : Surveys.getNodeDefParent({ survey, nodeDef: nodeDefCurrent })

        if (!nodeDefContext) {
          throw new Error(`Cannot find context nodeDef: ${nodeDef}`)
        }

        const context: NodeDefExpressionContext = { survey, nodeDefContext, nodeDefCurrent, selfReferenceAllowed: true }
        const result = new NodeDefExpressionEvaluator().evaluate(expression, context)
        if (expectedResultValue === null || expectedResultValue === undefined) {
          expect(result).toBe(expectedResultValue)
        } else {
          expectToBeNodeDef(result)
          const nodeDefResult: NodeDef<NodeDefType, NodeDefProps> = result
          expect(nodeDefResult.props.name).toEqual(expectedResultValue)
        }
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
