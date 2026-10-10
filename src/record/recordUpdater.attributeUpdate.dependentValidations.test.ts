import { describe, test, expect, beforeAll } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Survey } from '../survey'
import { Validations } from '../validation'
import { Record } from './record'

let user: User

// survey with a multiple entity "table" and a "coverage" attribute with the specified validation expression;
// record with 2 tables (coverage 10 and 90)
const createSurveyAndRecord = async (coverageValidationExpression: string) => {
  const survey = await new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('identifier').key(),
      entityDef(
        'table',
        integerDef('table_id').key(),
        integerDef('coverage').validationExpressions(coverageValidationExpression)
      ).multiple()
    )
  ).build()

  const record = new RecordBuilder(
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
  return { survey, record, nodeToUpdate, siblingNode }
}

const updateValue = (params: { survey: Survey; record: Record; attributeUuid: string; value: number }) =>
  RecordUpdater.updateAttributeValue({ user, ...params })

describe('RecordUpdater - attribute update => update dependent validations', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Self dependent validation rule (e.g. sum of sibling values)', async () => {
    const created = await createSurveyAndRecord(`sum(parent($context).table.coverage) == 100`)
    const { survey, nodeToUpdate, siblingNode } = created
    let { record } = created
    expect(nodeToUpdate.uuid).not.toEqual(siblingNode.uuid)

    // set table[0].coverage to 80 (sum = 170) => validations not valid
    let updateResult = await updateValue({ survey, record, attributeUuid: nodeToUpdate.uuid, value: 80 })

    record = updateResult.record
    let validation = Validations.getValidation(record)
    const fieldValidations = Validations.getFieldValidations(validation)
    expect(Object.keys(fieldValidations)).toHaveLength(2)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeFalsy()
    expect(Validations.getFieldValidation(siblingNode.uuid)(validation).valid).toBeFalsy()

    // set table[0].coverage to 10 (sum = 100) => validation valid
    updateResult = await updateValue({ survey, record, attributeUuid: nodeToUpdate.uuid, value: 10 })
    record = updateResult.record
    validation = Validations.getValidation(record)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeTruthy()
    expect(Validations.getFieldValidation(siblingNode.uuid)(validation).valid).toBeTruthy()
  })

  test('Self referencing validation rule (e.g. range check): only the updated node is validated', async () => {
    const created = await createSurveyAndRecord(`coverage >= 0 && coverage <= 100`)
    const { survey, nodeToUpdate, siblingNode } = created
    let { record } = created

    // set table[0].coverage to 150 => not valid; table[1].coverage is not affected
    let updateResult = await updateValue({ survey, record, attributeUuid: nodeToUpdate.uuid, value: 150 })
    record = updateResult.record
    let validation = Validations.getValidation(record)
    expect(Object.keys(Validations.getFieldValidations(validation))).toEqual([nodeToUpdate.uuid])
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeFalsy()
    expect(Object.keys(updateResult.nodes)).not.toContain(siblingNode.uuid)

    // set table[0].coverage to 50 => valid
    updateResult = await updateValue({ survey, record, attributeUuid: nodeToUpdate.uuid, value: 50 })
    record = updateResult.record
    validation = Validations.getValidation(record)
    expect(Validations.getFieldValidation(nodeToUpdate.uuid)(validation).valid).toBeTruthy()
  })
})
