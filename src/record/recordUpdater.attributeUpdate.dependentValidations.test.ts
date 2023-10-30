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
          integerDef('coverage').validationExpressions(`sum(parent($context).table.coverage) == 100`)
        ).multiple()
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('table', attribute('table_id', 1), attribute('coverage', 10)),
        entity('table', attribute('table_id', 2), attribute('coverage', 90))
      )
    ).build()

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'table[0].coverage' })
    const siblingNode = TestUtils.getNodeByPath({ survey, record, path: 'table[1].coverage' })
    expect(nodeToUpdate.uuid).not.toEqual(siblingNode.uuid)

    // set table[0].coverage to 80 (sum = 170) => validations not valid
    let updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: nodeToUpdate.uuid,
      value: 80,
    })

    record = updateResult.record
    let validation = Validations.getValidation(record)
    const fieldValidations = Validations.getFieldValidations(validation)
    expect(Object.keys(fieldValidations).length).toEqual(2)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeFalsy()
    expect(Validations.getFieldValidation(siblingNode.uuid)(validation).valid).toBeFalsy()

    // set table[0].coverage to 10 (sum = 100) => validation valid
    updateResult = await RecordUpdater.updateAttributeValue({
      survey,
      record,
      attributeUuid: nodeToUpdate.uuid,
      value: 10,
    })
    record = updateResult.record
    validation = Validations.getValidation(record)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeTruthy()
    expect(Validations.getFieldValidation(siblingNode.uuid)(validation).valid).toBeTruthy()
  })
})
