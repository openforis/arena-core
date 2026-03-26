import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordNodesUpdater } from '.'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { Records } from '../records'
import { Surveys } from '../../survey'
import { Record } from '../record'

let user: User

describe('Record nodes updater - applicability', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Applicability update', async () => {
    const survey = await new SurveyBuilder(
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

    const updateSourceAndExpectDependentApplicabilityToBe = async (params: {
      sourceValue: any
      expectDependentUpdate: boolean
      expectedApplicability: boolean
    }): Promise<Record> => {
      const { sourceValue, expectedApplicability, expectDependentUpdate } = params
      const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })

      const nodeUpdated = { ...nodeToUpdate, value: sourceValue }
      const recordUpdated = Records.addNode(nodeUpdated)(record)

      const updateResult = await RecordNodesUpdater.updateNodesDependents({
        user,
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

    record = await updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 30,
      expectDependentUpdate: false,
      expectedApplicability: true,
    })
    record = await updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 1,
      expectDependentUpdate: true,
      expectedApplicability: false,
    })
    record = await updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 9,
      expectDependentUpdate: false,
      expectedApplicability: false,
    })
    record = await updateSourceAndExpectDependentApplicabilityToBe({
      sourceValue: 21,
      expectDependentUpdate: true,
      expectedApplicability: true,
    })
  })

  test('Clear non-applicable values when node becomes non-applicable', async () => {
    const survey = await new SurveyBuilder(
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
        attribute('dependent_attribute', 100)
      )
    ).build()

    // First verify the dependent attribute is applicable and has a value
    let dependentNode = TestUtils.getNodeByPath({
      survey,
      record,
      path: 'root_entity.dependent_attribute',
    })
    expect(Records.isNodeApplicable({ record, node: dependentNode })).toBe(true)
    expect(dependentNode.value).toBe(100)

    // Update source attribute to make dependent non-applicable WITHOUT clearNonApplicableValues
    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
    const nodeUpdated = { ...nodeToUpdate, value: 5 }
    let recordUpdated = Records.addNode(nodeUpdated)(record)

    let updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: nodeUpdated },
      clearNonApplicableValues: false, // explicitly set to false
    })

    dependentNode = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.dependent_attribute',
    })
    expect(Records.isNodeApplicable({ record: updateResult.record, node: dependentNode })).toBe(false)
    expect(dependentNode.value).toBe(100) // Value should still be there

    // Now update with clearNonApplicableValues enabled
    recordUpdated = Records.addNode({ ...nodeToUpdate, value: 20 })(updateResult.record)
    updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: { ...nodeToUpdate, value: 20 } },
      clearNonApplicableValues: false, // first make it applicable again
    })

    dependentNode = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.dependent_attribute',
    })
    expect(Records.isNodeApplicable({ record: updateResult.record, node: dependentNode })).toBe(true)
    expect(dependentNode.value).toBe(100) // Value restored

    // Now make it non-applicable WITH clearNonApplicableValues
    recordUpdated = Records.addNode({ ...nodeToUpdate, value: 5 })(updateResult.record)
    updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: { ...nodeToUpdate, value: 5 } },
      clearNonApplicableValues: true, // Enable value clearing
    })

    dependentNode = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.dependent_attribute',
    })
    expect(Records.isNodeApplicable({ record: updateResult.record, node: dependentNode })).toBe(false)
    expect(dependentNode.value).toBeNull() // Value should be cleared
  })
})
