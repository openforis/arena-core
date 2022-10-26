import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Records } from './records'
import { Record } from './record'
import { Validations } from '../validation/validations'
import { Survey } from '../survey'

let user: User

const updateAttributeAndExpectValidation = async (params: {
  survey: Survey
  record: Record
  nodePath: string
  value: any
  validationNodePath?: string
  expectedFieldValidation: boolean
  expectedValidationFieldsSize: number
}): Promise<Record> => {
  const {
    survey,
    record,
    nodePath,
    value,
    validationNodePath = params.nodePath,
    expectedFieldValidation,
    expectedValidationFieldsSize,
  } = params
  const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: nodePath })

  const nodeUpdated = { ...nodeToUpdate, value }
  const recordUpdated = Records.addNode(nodeUpdated)(record)

  const updateResult = await RecordUpdater.updateNode({
    survey,
    record: recordUpdated,
    node: nodeUpdated,
  })

  expect(updateResult).not.toBeNull()

  const validation = Validations.getValidation(updateResult.record)

  const validationNode = TestUtils.getNodeByPath({ survey, record, path: validationNodePath })
  const expectedFieldValidationNodeUuid = validationNode?.uuid

  const fieldValidation = Validations.getFieldValidation(expectedFieldValidationNodeUuid)(validation)

  expect(fieldValidation.valid).toBe(expectedFieldValidation)
  expect(Object.values(Validations.getFieldValidations(validation)).length).toBe(expectedValidationFieldsSize)

  return updateResult.record
}

describe('Record updater - required attribute', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Validation: required value', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('int_attr').validationExpressions('this > 10'),
        textDef('remarks')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('int_attr', 20),
        attribute('remarks', 'Some remarks')
      )
    ).build()

    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: null,
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: 10,
      expectedFieldValidation: true,
      expectedValidationFieldsSize: 0,
    })
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: null,
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })

    // test that changing another attribute does not affect existing attribute validations
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.remarks',
      value: null,
      validationNodePath: 'root_entity.identifier',
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })

    expect(record).not.toBeNull()
  })

  test('Validation: attribute validation expression', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('int_attr').validationExpressions('this > 10')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 10), attribute('int_attr', 20))
    ).build()

    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.int_attr',
      value: 9,
      validationNodePath: 'root_entity.int_attr',
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })

    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.int_attr',
      value: 11,
      validationNodePath: 'root_entity.int_attr',
      expectedFieldValidation: true,
      expectedValidationFieldsSize: 0,
    })

    expect(record).not.toBeNull()
  })
})
