import { beforeAll, describe, test, expect } from '@jest/globals'

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

const expectDependentContextNodes = (params: {
  sourcePath: string
  dependencyType: SurveyDependencyType
  expectedContextNodePaths: string[]
}) => {
  const { sourcePath, dependencyType, expectedContextNodePaths } = params
  const source = TestUtils.getNodeByPath({ survey, record, path: sourcePath })
  const dependentNodePointers = Records.getDependentNodePointers({ survey, record, node: source, dependencyType })
  const contextNodeUuids = dependentNodePointers.map((pointer) => pointer.nodeCtx.uuid)
  const expectedContextNodeUuids = expectedContextNodePaths.map(
    (path) => TestUtils.getNodeByPath({ survey, record, path }).uuid
  )
  expect(contextNodeUuids).toEqual(expectedContextNodeUuids)
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
          integerDef('plot_relevant_if_cluster_boolean_attribute').applyIf('cluster_boolean_attribute'),
          // self reference resolved inside the same plot
          integerDef('plot_area').validationExpressions('plot_area > 0 && plot_area <= 10000'),
          // self references to the attribute in the other plots (member property or filter)
          integerDef('plot_coverage').validationExpressions('sum(parent($context).plot.plot_coverage) <= 100'),
          integerDef('plot_slope').validationExpressions('count(parent($context).plot[plot_slope > 45]) < 2')
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
        entity(
          'plot',
          attribute('plot_id', 1),
          attribute('plot_area', 100),
          attribute('plot_coverage', 10),
          attribute('plot_slope', 10)
        ),
        entity(
          'plot',
          attribute('plot_id', 2),
          attribute('plot_area', 200),
          attribute('plot_coverage', 10),
          attribute('plot_slope', 10)
        ),
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

  test('Validation expression self reference: only the node in the same parent entity is dependent', () => {
    expectDependentContextNodes({
      sourcePath: 'plot[1].plot_area',
      dependencyType: SurveyDependencyType.validations,
      expectedContextNodePaths: ['plot[1]'],
    })
  })

  test('Validation expression self reference through member expression: nodes in every entity are dependent', () => {
    expectDependentContextNodes({
      sourcePath: 'plot[1].plot_coverage',
      dependencyType: SurveyDependencyType.validations,
      expectedContextNodePaths: ['plot[0]', 'plot[1]', 'plot[2]'],
    })
  })

  test('Validation expression self reference in filter: nodes in every entity are dependent', () => {
    expectDependentContextNodes({
      sourcePath: 'plot[1].plot_slope',
      dependencyType: SurveyDependencyType.validations,
      expectedContextNodePaths: ['plot[0]', 'plot[1]', 'plot[2]'],
    })
  })
})
