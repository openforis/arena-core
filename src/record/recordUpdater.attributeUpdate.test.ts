import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Record } from './record'
import { Validations } from '../validation/validations'
import { Survey } from '../survey'
import { NodeDefExpressionFactory } from '../nodeDef/nodeDef'

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

  const updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeUuid: nodeToUpdate.uuid,
    value,
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

describe('RecordUpdater - attribute update', () => {
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

  test('Validation: attribute validation with multiple expressions', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('source').key(),
        integerDef('dependent').validationExpressions(
          'this > 10',
          NodeDefExpressionFactory.createInstance({
            expression: 'this < 100',
            applyIf: 'source > 10',
          })
        )
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('source', 5), attribute('dependent', 200))
    ).build()

    const updateSource = async (params: { value: any; expectedValidationResult: boolean }) => {
      const { value, expectedValidationResult } = params
      record = await updateAttributeAndExpectValidation({
        survey,
        record,
        nodePath: 'root_entity.source',
        value,
        validationNodePath: 'root_entity.dependent',
        expectedFieldValidation: expectedValidationResult,
        expectedValidationFieldsSize: expectedValidationResult ? 0 : 1,
      })
    }

    // identifier > 10 (int_attr should be < 100) => error
    await updateSource({ value: 11, expectedValidationResult: false })

    // identifier < 10 => ok
    await updateSource({ value: 8, expectedValidationResult: true })

    expect(record).not.toBeNull()
  })

  test('Validation: dependent attribute with relevancy valid default value', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('int_attr')
          .defaultValue('identifier + 10')
          .validationExpressions('this > 30')
          .applyIf('identifier > 10')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 0), attribute('int_attr'))
    ).build()

    const validationNodePath = 'root_entity.int_attr'

    // identifier = 1 =>  attribute not relevant, default value not applied
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: 1,
      validationNodePath,
      expectedFieldValidation: true,
      expectedValidationFieldsSize: 0,
    })

    let validationNode = TestUtils.getNodeByPath({ survey, record, path: validationNodePath })
    expect(validationNode?.value).toBeNull()

    // identifier = 11 => attribute relevant, default value applied (value not valid)
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: 11,
      validationNodePath,
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })

    validationNode = TestUtils.getNodeByPath({ survey, record, path: validationNodePath })
    expect(validationNode?.value).toBe(21)

    // identifier = 21 => attribute relevant, default value applied (value valid)
    record = await updateAttributeAndExpectValidation({
      survey,
      record,
      nodePath: 'root_entity.identifier',
      value: 21,
      validationNodePath,
      expectedFieldValidation: true,
      expectedValidationFieldsSize: 0,
    })

    validationNode = TestUtils.getNodeByPath({ survey, record, path: validationNodePath })
    expect(validationNode?.value).toBe(31)
  })
})
