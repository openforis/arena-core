import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

import { User } from '../auth'
import { RecordUpdater } from './recordUpdater'

let user: User

describe('RecordUpdater - node delete', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Entity deletion', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('mult_entity', integerDef('mult_entity_id').key(), integerDef('mult_entity_attr')).multiple(),
        integerDef('dependent_attribute').readOnly().defaultValue('count(mult_entity)')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('mult_entity', attribute('mult_entity_id', 1), attribute('mult_entity_attr', 10)),
        attribute('dependent_attribute', 1)
      )
    ).build()

    const nodeToDeletePath = 'root_entity.mult_entity[0]'
    const nodeToDelete = TestUtils.getNodeByPath({ survey, record, path: nodeToDeletePath })

    const updateResult = await RecordUpdater.deleteNode({ survey, record, node: nodeToDelete })
    record = updateResult.record

    const nodeDeleted = TestUtils.findNodeByPath({ survey, record, path: nodeToDeletePath })
    expect(nodeDeleted).toBeUndefined()

    const dependentNode = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.dependent_attribute' })
    expect(dependentNode.value).toBe(0)
  })
})
