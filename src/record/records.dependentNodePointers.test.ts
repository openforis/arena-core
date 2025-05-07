import { Survey } from '../survey'
import { SurveyDependencyType } from '../survey/survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from './record'
import { TestUtils } from '../tests/testUtils'
import { Records } from './records'
import { createTestAdminUser } from '../tests/data'

let survey: Survey
let record: Record

const expectDependents = (params: {
  sourcePath: string
  dependencyType: SurveyDependencyType
  expectedDependentNames: string[]
}) => {
  const { sourcePath, dependencyType, expectedDependentNames } = params
  const source = TestUtils.getNodeByPath({ survey, record, path: sourcePath })
  const dependentNodePointers = Records.getDependentNodePointers({ survey, record, node: source, dependencyType })
  const dependentNames = dependentNodePointers.map((pointer) => pointer.nodeDef.props.name)
  expect(dependentNames).toEqual(expectedDependentNames)
}

describe('Records: dependent node pointers', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key().defaultValue('1').validationExpressions('cluster_id > 0 && cluster_id <= 1000'),
        booleanDef('accessible'),
        booleanDef('cluster_boolean_attribute'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          integerDef('plot_id_double').readOnly().defaultValue('plot_id * 2'),
          integerDef('plot_relevant_if_cluster_boolean_attribute').applyIf('cluster_boolean_attribute')
        )
          .multiple()
          .applyIf('accessible')
      )
    ).build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        attribute('accessible', 'true'),
        attribute('cluster_boolean_attribute', 'true'),
        entity('plot', attribute('plot_id', 1)),
        entity('plot', attribute('plot_id', 2)),
        entity('plot', attribute('plot_id', 3))
      )
    ).build()
  }, 10000)

  test('Default values dependency (readOnly attribute)', () => {
    expectDependents({
      sourcePath: 'plot[0].plot_id',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: ['plot_id_double'],
    })
  })

  test('Apply if dependency', () => {
    expectDependents({
      sourcePath: 'accessible',
      dependencyType: SurveyDependencyType.applicable,
      expectedDependentNames: ['plot'],
    })
  })

  test('Apply if dependency in nested entity', () => {
    expectDependents({
      sourcePath: 'cluster_boolean_attribute',
      dependencyType: SurveyDependencyType.applicable,
      expectedDependentNames: [
        'plot_relevant_if_cluster_boolean_attribute',
        'plot_relevant_if_cluster_boolean_attribute',
        'plot_relevant_if_cluster_boolean_attribute',
      ],
    })
  })

  test('Validation expression dependency', () => {
    expectDependents({
      sourcePath: 'cluster_id',
      dependencyType: SurveyDependencyType.validations,
      expectedDependentNames: ['cluster_id'],
    })
  })
})
