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

  test('Entity deletion: no side effect', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('mult_entity', integerDef('mult_entity_id').key(), integerDef('mult_entity_attr')).multiple()
      )
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('mult_entity', attribute('mult_entity_id', 1), attribute('mult_entity_attr', 10)),
        entity('mult_entity', attribute('mult_entity_id', 2), attribute('mult_entity_attr', 20))
      )
    ).build()

    const nodeToDeletePath = 'root_entity.mult_entity[1]'
    const nodeToDelete = TestUtils.getNodeByPath({ survey, record, path: nodeToDeletePath })

    const updateResult = await RecordUpdater.deleteNode({ survey, record, nodeUuid: nodeToDelete.uuid })
    const { nodesDeleted, record: recordUpdated } = updateResult

    // check record updated is a new object
    expect(recordUpdated).not.toBe(record)

    // check deleted nodes
    const nodesDeletedNames = Object.values(nodesDeleted).map(TestUtils.getNodeName({ survey })).sort()
    expect(nodesDeletedNames).toEqual(['mult_entity', 'mult_entity_attr', 'mult_entity_id'])

    // check deleted node not in updated record anymore
    const nodeDeleted = TestUtils.findNodeByPath({ survey, record: recordUpdated, path: nodeToDeletePath })
    expect(nodeDeleted).toBeUndefined()

    // check deleted node still in original record
    const nodeDeletedOriginal = TestUtils.findNodeByPath({ survey, record, path: nodeToDeletePath })
    expect(nodeDeletedOriginal).not.toBeUndefined()
  })

  test('Entity deletion: update dependent attributes', async () => {
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
    const { nodes: nodesUpdated, record: recordUpdated } = updateResult

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

  test('Entity deletion: cleanup validation', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('int_gt_5').validationExpressions('this > 5'),
        entityDef(
          'mult_entity',
          integerDef('mult_entity_id').key(),
          integerDef('mult_entity_int_gt_10').validationExpressions('this > 10')
        ).multiple()
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('int_gt_5', 6),
        entity('mult_entity', attribute('mult_entity_id', 1), attribute('mult_entity_int_gt_10', 11)),
        entity('mult_entity', attribute('mult_entity_id', 2), attribute('mult_entity_int_gt_10', 20))
      )
    ).build()

    // set int_gt_5 to 4 => 1 error
    const intGt5 = TestUtils.getNodeByPath({ survey, record, path: 'int_gt_5' })
    let updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: intGt5.uuid,
      value: 4,
    })
    record = updateResult.record
    expect(Validations.getValidation(record).valid).toBeFalsy()
    expect(Object.values(Validations.getFieldValidations(Validations.getValidation(record))).length).toBe(1)

    // set mult_entity[1].mult_entity_int_gt_10 to 7 => 2 errors
    const multEntityIntGt10 = TestUtils.getNodeByPath({ survey, record, path: 'mult_entity[1].mult_entity_int_gt_10' })
    updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: multEntityIntGt10.uuid,
      value: 7,
    })
    record = updateResult.record
    expect(Validations.getValidation(record).valid).toBeFalsy()
    expect(Object.values(Validations.getFieldValidations(Validations.getValidation(record))).length).toBe(2)

    // delete mult_entity[1] => 1 error
    const nodeToDeletePath = 'root_entity.mult_entity[1]'
    const nodeToDelete = TestUtils.getNodeByPath({ survey, record, path: nodeToDeletePath })

    updateResult = await RecordUpdater.deleteNode({ survey, record, nodeUuid: nodeToDelete.uuid })
    record = updateResult.record
    expect(Object.values(Validations.getFieldValidations(Validations.getValidation(record))).length).toBe(1)

    // set int_gt_5 to 6 => 0 errors
    updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: intGt5.uuid,
      value: 6,
    })
    record = updateResult.record
    expect(Validations.getValidation(record).valid).toBeTruthy()
    expect(Object.values(Validations.getFieldValidations(Validations.getValidation(record))).length).toBe(0)
  })

  test('Entity deletion: nodes index consistency', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('int_gt_5'),
        entityDef('mult_entity', integerDef('mult_entity_id').key(), integerDef('mult_entity_int_gt_10')).multiple()
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('int_gt_5', 6),
        entity('mult_entity', attribute('mult_entity_id', 1), attribute('mult_entity_int_gt_10', 11)),
        entity('mult_entity', attribute('mult_entity_id', 2), attribute('mult_entity_int_gt_10', 20))
      )
    ).build()

    const initialRecordIndexStr = JSON.stringify(record._nodesIndex)

    // add mult_entity (tot = 3 entities)
    const rootNode = Records.getRoot(record)
    const multEntityDef = Surveys.getNodeDefByName({ survey, name: 'mult_entity' })
    let updateResult = await RecordUpdater.createNodeAndDescendants({
      survey,
      record,
      parentNode: rootNode,
      nodeDef: multEntityDef,
    })
    expect(Object.values(updateResult.record._nodesIndex?.nodesByDef?.[multEntityDef.uuid] ?? {}).length).toBe(3)

    record = updateResult.record

    // delete last mult_entity (tot = 2 entities)
    const nodeToDeletePath = 'root_entity.mult_entity[2]'
    const nodeToDelete = TestUtils.getNodeByPath({ survey, record, path: nodeToDeletePath })

    updateResult = await RecordUpdater.deleteNode({ survey, record, nodeUuid: nodeToDelete.uuid })
    expect(Object.values(updateResult.record._nodesIndex?.nodesByDef?.[multEntityDef.uuid] ?? {}).length).toBe(2)

    record = updateResult.record

    // nodes index should have been turned back to how it was at the beginning
    expect(JSON.stringify(record._nodesIndex)).toEqual(initialRecordIndexStr)
  })
})
