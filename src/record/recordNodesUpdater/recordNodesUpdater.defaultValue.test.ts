import { describe, test, expect, beforeAll } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { coordinateDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordNodesUpdater } from '../recordNodesUpdater'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { Records } from './../records'

let user: User

describe('Record nodes updater - default values', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Default value update (read-only attribute)', async () => {
    const survey = await new SurveyBuilder(
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

    const updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: nodeUpdated },
    })
    expect(updateResult).not.toBeNull()
    expect(Object.values(updateResult.nodes)).toHaveLength(2)

    const dependentNode = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.some_number_double',
    })
    expect(dependentNode).not.toBeNull()
    expect(dependentNode.value).toBe(8)
  })

  test('Default value replaces the previous value (props of the previous value not kept)', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        coordinateDef('source_location'),
        coordinateDef('location').readOnly().defaultValue('source_location')
      )
    ).build()

    const sourceValue = { x: 12.5, y: 41.9, srs: 'EPSG:4326', accuracy: 5 }
    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_location', sourceValue),
        attribute('location', null)
      )
    ).build()

    const updateSource = async (rec: typeof record, value: any) => {
      const sourceNode = TestUtils.getNodeByPath({ survey, record: rec, path: 'root_entity.source_location' })
      const sourceNodeUpdated = { ...sourceNode, value }
      const updateResult = await RecordNodesUpdater.updateNodesDependents({
        user,
        survey,
        record: Records.addNode(sourceNodeUpdated)(rec),
        nodes: { [sourceNode.uuid]: sourceNodeUpdated },
      })
      return updateResult.record
    }
    const recordWithAccuracy = await updateSource(record, sourceValue)
    expect(TestUtils.getNodeByPath({ survey, record: recordWithAccuracy, path: 'root_entity.location' }).value).toEqual(
      sourceValue
    )

    const sourceValueNext = { x: 13, y: 42, srs: 'EPSG:4326' }
    const recordUpdated = await updateSource(recordWithAccuracy, sourceValueNext)
    expect(TestUtils.getNodeByPath({ survey, record: recordUpdated, path: 'root_entity.location' }).value).toEqual(
      sourceValueNext
    )
  })
})
