import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { User } from '../auth'
import { Nodes } from '../node'
import { NodeDef, NodeDefExpressionFactory } from '../nodeDef/nodeDef'
import { Survey, Surveys } from '../survey'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Validations } from '../validation'
import { Record } from './record'
import { RecordUpdater } from './recordUpdater'
import { RecordValidations } from './recordValidations'
import { Records } from './records'

let user: User

const updateSourceAndExpectMinCountValidation = async ({
  survey,
  record,
  attributeIId,
  dependentNodeDef,
  value,
  expectedMinCount,
  expectedValid,
}: {
  survey: Survey
  record: Record
  attributeIId: number
  dependentNodeDef: NodeDef<any>
  value: number
  expectedMinCount: number
  expectedValid: boolean
}): Promise<Record> => {
  const updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeIId,
    value,
  })

  record = updateResult.record
  const root = Records.getRoot(record)!

  // check min count value
  const minCount = Nodes.getChildrenMinCount({ parentNode: root, nodeDef: dependentNodeDef })
  expect(minCount).toEqual(expectedMinCount)

  // check validation
  const validation = Validations.getValidation(record)

  const minCountValid = RecordValidations.getValidationChildrenCount({
    nodeParentInternalId: root.iId,
    nodeDefChildUuid: dependentNodeDef.uuid,
  })(validation).valid

  expect(minCountValid).toEqual(expectedValid)

  return record
}

describe('RecordUpdater - attribute update => update dependent count validations', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Dependent min count validation update', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('source_attribute'),
        integerDef('dependent_attribute')
          .multiple()
          .minCount([NodeDefExpressionFactory.createInstance({ expression: 'source_attribute + 2' })])
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_attribute', 1),
        attribute('dependent_attribute', 22),
        attribute('dependent_attribute', 23),
        attribute('dependent_attribute', 24)
      )
    ).build()

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
    const attributeIId = nodeToUpdate.iId
    const dependentNodeDef = Surveys.getNodeDefByName({ survey, name: 'dependent_attribute' })

    const commonParams = { survey, attributeIId, dependentNodeDef }

    record = await updateSourceAndExpectMinCountValidation({
      ...commonParams,
      record,
      value: 2,
      expectedMinCount: 4,
      expectedValid: false,
    })
    record = await updateSourceAndExpectMinCountValidation({
      ...commonParams,
      record,
      value: 4,
      expectedMinCount: 6,
      expectedValid: false,
    })
    record = await updateSourceAndExpectMinCountValidation({
      ...commonParams,
      record,
      value: 0,
      expectedMinCount: 2,
      expectedValid: true,
    })

    expect(record).toBeDefined()
  })

  test('Dependent min count (with relevancy) validation update', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('source_attribute'),
        booleanDef('relevancy_trigger'),
        integerDef('dependent_attribute')
          .multiple()
          .applyIf('relevancy_trigger == true')
          .minCount([NodeDefExpressionFactory.createInstance({ expression: 'source_attribute + 2' })])
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_attribute', 1),
        attribute('relevancy_trigger', 'true'),
        attribute('dependent_attribute', 22),
        attribute('dependent_attribute', 23),
        attribute('dependent_attribute', 24)
      )
    ).build()

    const dependentNodeDef = Surveys.getNodeDefByName({ survey, name: 'dependent_attribute' })

    const updateTriggerAndExpectMinCountValidation = async ({
      value,
      expectedValid,
    }: {
      value: boolean
      expectedValid: boolean
    }): Promise<Record> => {
      const triggerNode = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.relevancy_trigger' })
      const triggerAttributeIId = triggerNode.iId
      const updateResult = await RecordUpdater.updateAttributeValue({
        user,
        survey,
        record,
        attributeIId: triggerAttributeIId,
        value: String(value),
      })

      record = updateResult.record
      const root = Records.getRoot(record)!

      // check validation
      const validation = Validations.getValidation(record)
      const minCountValid = RecordValidations.getValidationChildrenCount({
        nodeParentInternalId: root.iId,
        nodeDefChildUuid: dependentNodeDef.uuid,
      })(validation).valid

      expect(minCountValid).toEqual(expectedValid)

      return record
    }

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
    const attributeIId = nodeToUpdate.iId

    const commonParams = { survey, attributeIId, dependentNodeDef }

    record = await updateSourceAndExpectMinCountValidation({
      ...commonParams,
      record,
      value: 2,
      expectedMinCount: 4,
      expectedValid: false,
    })

    record = await updateTriggerAndExpectMinCountValidation({ value: false, expectedValid: true })

    record = await updateTriggerAndExpectMinCountValidation({ value: true, expectedValid: false })

    expect(record).toBeDefined()
  })
})
