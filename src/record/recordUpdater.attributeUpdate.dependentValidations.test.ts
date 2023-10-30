import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Validations } from '../validation'

let user: User

describe('RecordUpdater - attribute update => update dependent validations', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Self dependent validation rule (e.g. sum of sibling values)', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef(
          'table',
          integerDef('table_id').key(),
          integerDef('percentage').validationExpressions(`sum(parent($context).table.percentage) == 100`)
        ).multiple()
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('table', attribute('table_id', 1), attribute('percentage', 10)),
        entity('table', attribute('table_id', 2), attribute('percentage', 90))
      )
    ).build()

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'table[0].percentage' })
    const siblingNode = TestUtils.getNodeByPath({ survey, record, path: 'table[1].percentage' })
    expect(nodeToUpdate.uuid).not.toEqual(siblingNode.uuid)

    let updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: nodeToUpdate.uuid,
      value: 80,
    })

    record = updateResult.record

    const fieldValidations = Validations.getFieldValidations(Validations.getValidation(record))

    expect(Object.keys(fieldValidations).length).toEqual(2)
    expect(Object.keys(fieldValidations).includes(nodeToUpdate.uuid)).toBeTruthy()
    expect(Object.keys(fieldValidations).includes(siblingNode.uuid)).toBeTruthy()

    updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: nodeToUpdate.uuid,
      value: 10,
    })
    record = updateResult.record

    const validation = Validations.getValidation(record)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeTruthy()
    expect(Validations.getFieldValidation(siblingNode.uuid)(validation).valid).toBeTruthy()
  })
})
