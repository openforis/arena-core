/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

import { User } from '../auth'
import { RecordUpdater } from './recordUpdater'
import { RecordValidations } from './recordValidations'
import { Records } from './records'
import { Surveys } from '../survey'
import { Validations } from '../validation'

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
        entityDef('mult_entity', integerDef('mult_entity_id').key(), integerDef('mult_entity_attr'))
          .multiple()
          .minCount(2),
        integerDef('mult_entity_count').readOnly().defaultValue('count(mult_entity)'),
        integerDef('mult_entity_attr_sum').readOnly().defaultValue('sum(mult_entity.mult_entity_attr)')
      )
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('mult_entity', attribute('mult_entity_id', 1), attribute('mult_entity_attr', 10)),
        entity('mult_entity', attribute('mult_entity_id', 2), attribute('mult_entity_attr', 20)),
        attribute('mult_entity_count', null),
        attribute('mult_entity_attr_sum', null)
      )
    ).build()

    const nodeToDeletePath = 'root_entity.mult_entity[1]'
    const nodeToDelete = TestUtils.getNodeByPath({ survey, record, path: nodeToDeletePath })

    const updateResult = await RecordUpdater.deleteNode({ survey, record, nodeUuid: nodeToDelete.uuid })
    const { nodesDeleted, nodes: nodesUpdated, record: recordUpdated } = updateResult

    expect(recordUpdated).not.toBe(record)

    // check deleted nodes
    const nodesDeletedNames = Object.values(nodesDeleted).map(TestUtils.getNodeName({ survey })).sort()
    expect(nodesDeletedNames).toEqual(['mult_entity', 'mult_entity_attr', 'mult_entity_id'])

    // check deleted node not in updated record anymore
    const nodeDeleted = TestUtils.findNodeByPath({ survey, record: recordUpdated, path: nodeToDeletePath })
    expect(nodeDeleted).toBeUndefined()

    // check updated nodes (including deleted ones)
    const nodesUpdatedNames = Object.values(nodesUpdated).map(TestUtils.getNodeName({ survey })).sort()
    expect(nodesUpdatedNames).toEqual([
      'mult_entity',
      'mult_entity_attr',
      'mult_entity_attr_sum',
      'mult_entity_count',
      'mult_entity_id',
    ])

    // check dependent read-only attribute updated
    const multipleEntityCountNodeUpdated = TestUtils.getNodeByPath({
      survey,
      record: recordUpdated,
      path: 'root_entity.mult_entity_count',
    })
    expect(multipleEntityCountNodeUpdated.value).toBe(1)

    // check dependent read-only attribute updated (nested attribute)
    const multipleEntityAttrSumNodeUpdated = TestUtils.getNodeByPath({
      survey,
      record: recordUpdated,
      path: 'root_entity.mult_entity_attr_sum',
    })
    expect(multipleEntityAttrSumNodeUpdated.value).toBe(10)

    // check min count validation
    const root = Records.getRoot(recordUpdated)
    const multEntityDef = Surveys.getNodeDefByName({ survey, name: 'mult_entity' })
    const multEntityCountValidation = RecordValidations.getValidationChildrenCount({
      nodeParentUuid: root!.uuid,
      nodeDefChildUuid: multEntityDef.uuid,
    })(Validations.getValidation(recordUpdated))

    expect(multEntityCountValidation.valid).toBeFalsy()
    expect(multEntityCountValidation?.errors?.[0].key).toBe('record.nodes.count.minNotReached')
  })
})
