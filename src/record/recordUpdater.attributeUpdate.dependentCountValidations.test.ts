import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Validations } from '../validation'
import { RecordValidations } from './recordValidations'
import { Records } from './records'
import { Surveys } from '../survey'
import { Nodes } from '../node'
import { NodeDefExpressionFactory } from '../nodeDef/nodeDef'

let user: User

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
        attribute('dependent_attribute', [22, 23, 24])
      )
    ).build()

    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
    const dependentNodeDef = Surveys.getNodeDefByName({ survey, name: 'dependent_attribute' })

    const updateSourceAndExpectMinCountValidation = async (
      value: number,
      expectedMinCount: number,
      expectedValid: boolean
    ) => {
      const updateResult = await RecordUpdater.updateAttributeValue({
        user,
        survey,
        record,
        attributeUuid: nodeToUpdate.uuid,
        value,
      })

      record = updateResult.record
      const root = Records.getRoot(record)!

      // check min count value
      const minCount = Nodes.getChildrenMinCount({ parentNode: root, nodeDef: dependentNodeDef })
      expect(minCount).toEqual(expectedMinCount)

      // check validation
      const validation = Validations.getValidation(record)
      expect(
        RecordValidations.getValidationChildrenCount({
          nodeParentUuid: root.uuid,
          nodeDefChildUuid: dependentNodeDef.uuid,
        })(validation).valid
      ).toEqual(expectedValid)
    }

    updateSourceAndExpectMinCountValidation(2, 4, false)
    updateSourceAndExpectMinCountValidation(4, 6, false)
    updateSourceAndExpectMinCountValidation(0, 2, true)
  })
})
