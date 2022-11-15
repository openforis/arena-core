import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
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
})
