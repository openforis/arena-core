import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordNodesUpdater } from './recordNodesUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Records } from './records'
import { Surveys } from '../survey'
import { Record } from './record'

let user: User

describe('Record nodes updater', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Default value update (read-only attribute)', () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('some_number'),
        integerDef('some_number_double').readOnly().defaultValue('some_number * 2')
      )
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('some_number', 2),
        attribute('some_number_double', null)
      )
    ).build()

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.some_number' })
    const nodeUpdated = { ...nodeToUpdate, value: 4 }
    const recordUpdated = Records.addNode(nodeUpdated)(record)

    const updateResult = RecordNodesUpdater.updateNodesDependents({
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: nodeUpdated },
    })
    expect(updateResult).not.toBeNull()
    expect(Object.values(updateResult.nodes).length).toBe(2)

    const dependentNode = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.some_number_double',
    })
    expect(dependentNode).not.toBeNull()
    expect(dependentNode.value).toBe(8)
  })

  test('Applicability update', () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('source_attribute'),
        integerDef('dependent_attribute').applyIf('source_attribute > 10')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_attribute', 20),
        attribute('dependent_attribute')
      )
    ).build()

    const rootNode = Records.getRoot(record)
    if (!rootNode) throw new Error('root node undefined')

    const updateSourceAndExpectDependentApplicabilityToBe = (params: {
      sourceValue: any
      expectDependentUpdate: boolean
      expectedApplicability: boolean
    }): Record => {
      const { sourceValue, expectedApplicability, expectDependentUpdate } = params
      const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })

      const nodeUpdated = { ...nodeToUpdate, value: sourceValue }
      const recordUpdated = Records.addNode(nodeUpdated)(record)

      const updateResult = RecordNodesUpdater.updateNodesDependents({
        survey,
        record: recordUpdated,
        nodes: { [nodeToUpdate.uuid]: nodeUpdated },
      })

      expect(updateResult).not.toBeNull()

      const dependentNode = TestUtils.getNodeByPath({
        survey,
        record: updateResult.record,
        path: 'root_entity.dependent_attribute',
      })

      if (expectDependentUpdate) {
        expect(
          Object.values(updateResult.nodes)
            .map((updatedNode) => Surveys.getNodeDefByUuid({ survey, uuid: updatedNode.nodeDefUuid }).props.name)
            .sort()
        ).toEqual(['dependent_attribute', 'root_entity', 'source_attribute'])
      }
      expect(Records.isNodeApplicable({ record: updateResult.record, node: dependentNode })).toBe(expectedApplicability)

      return updateResult.record
    }

    record = updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 30,
      expectDependentUpdate: false,
      expectedApplicability: true,
    })
    record = updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 1,
      expectDependentUpdate: true,
      expectedApplicability: false,
    })
    record = updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 9,
      expectDependentUpdate: false,
      expectedApplicability: false,
    })
    record = updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 21,
      expectDependentUpdate: true,
      expectedApplicability: true,
    })
  })
})
