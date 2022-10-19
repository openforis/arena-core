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
import { Surveys } from '../survey'

let user: User

describe('Record updater - required attribute', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Validation: required value', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef('root_entity', integerDef('identifier').key(), textDef('remarks'))
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 10), attribute('remarks', 'Some remarks'))
    ).build()

    const updateAttributeAndExpectValidation = async (params: {
      nodePath: string
      value: any
      validationNodePath?: string
      expectedFieldValidation: boolean
      expectedValidationFieldsSize: number
    }): Promise<Record> => {
      const {
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

      if (fieldValidation.valid !== expectedFieldValidation) {
        const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: validationNode.nodeDefUuid })
        throw new Error(
          '' +
            JSON.stringify(updateResult.record.validation) +
            '\n' +
            JSON.stringify(updateResult.validation) +
            '\n' +
            fieldValidation.valid +
            JSON.stringify(fieldValidation) +
            ' val ' +
            expectedFieldValidationNodeUuid +
            ' ' +
            nodeDef?.props?.name +
            ' ' +
            JSON.stringify(updateResult.validation)
        )
      }

      expect(fieldValidation.valid).toBe(expectedFieldValidation)
      expect(Object.values(Validations.getFieldValidations(validation)).length).toBe(expectedValidationFieldsSize)

      return updateResult.record
    }

    record = await updateAttributeAndExpectValidation({
      nodePath: 'root_entity.identifier',
      value: null,
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })
    record = await updateAttributeAndExpectValidation({
      nodePath: 'root_entity.identifier',
      value: 10,
      expectedFieldValidation: true,
      expectedValidationFieldsSize: 0,
    })
    record = await updateAttributeAndExpectValidation({
      nodePath: 'root_entity.identifier',
      value: null,
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })

    // test that changing another attribute does not affect existing attribute validations
    record = await updateAttributeAndExpectValidation({
      nodePath: 'root_entity.remarks',
      value: null,
      validationNodePath: 'root_entity.identifier',
      expectedFieldValidation: false,
      expectedValidationFieldsSize: 1,
    })
  })
})
