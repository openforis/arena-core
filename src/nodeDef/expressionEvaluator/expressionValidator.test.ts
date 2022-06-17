import { NodeDefExpressionValidator } from '..'
import { UserFactory } from '../../auth'
import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'

const { booleanDef, decimalDef, entityDef, integerDef } = SurveyObjectBuilders

type Query = {
  expression: string
  nodeDef?: string
  validationResult: boolean
  referencedNodeDefNames: Array<string>
  selfReferenceAllowed?: boolean
}

let survey: Survey

describe('NodeDefExpressionValidator', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@openforis-arena.org', name: 'test' })

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('accessible'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('tree', integerDef('tree_id').key(), decimalDef('tree_height')).multiple()
        ).multiple()
      )
    ).build()
  }, 10000)

  const queries: Query[] = [
    // wrong node def name
    { expression: 'not_existent', validationResult: false, referencedNodeDefNames: [] },
    // sibling node defs
    { expression: 'accessible', nodeDef: 'accessible', validationResult: true, referencedNodeDefNames: ['accessible'] },
    // self reference not allowed
    {
      expression: 'accessible',
      nodeDef: 'accessible',
      validationResult: false,
      referencedNodeDefNames: [],
      selfReferenceAllowed: false,
    },
    // parent of root entity should be undefined
    { expression: 'parent(cluster)', validationResult: true, referencedNodeDefNames: ['cluster'] },
    // computed expressions (access node at index)
    { expression: 'plot[0]', validationResult: true, referencedNodeDefNames: ['plot'] },
    {
      expression: '(accessible && cluster_id) || (accessible && plot[1].plot_id)',
      validationResult: true,
      referencedNodeDefNames: ['accessible', 'cluster_id', 'plot', 'plot_id'],
    },
    { expression: 'count(plot) == 2', validationResult: true, referencedNodeDefNames: ['plot'] },
    { expression: 'count(plot[plot_id == 1]) == 1', validationResult: true, referencedNodeDefNames: ['plot'] },
    {
      expression: 'sum(cluster.plot.tree.tree_height) == 110',
      validationResult: true,
      referencedNodeDefNames: ['cluster', 'plot', 'tree', 'tree_height'],
    },
  ]

  queries.forEach((query: Query) => {
    const {
      expression,
      validationResult: validationResultExpected,
      referencedNodeDefNames: referencedNodeDefNamesExpected = [],
      nodeDef,
      selfReferenceAllowed = true,
    } = query

    test(`${expression}${nodeDef ? ` (nodeDef: ${nodeDef})` : ''}`, () => {
      const nodeDefCurrent = nodeDef
        ? Surveys.getNodeDefByName({ survey, name: nodeDef })
        : Surveys.getNodeDefRoot({ survey })

      const { validationResult, referencedNodeDefUuids } = new NodeDefExpressionValidator().validate({
        expression,
        survey,
        nodeDefCurrent,
        selfReferenceAllowed,
      })

      expect(validationResult.valid).toBe(validationResultExpected)

      const rerencedNodeDefUuids = [...referencedNodeDefUuids.values()]
      const referencedNodeDefNames = rerencedNodeDefUuids.map(
        (nodeDefUuid) => Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid }).props.name
      )
      referencedNodeDefNames.sort()
      expect(referencedNodeDefNamesExpected).toEqual(referencedNodeDefNames)
    })
  })
})
