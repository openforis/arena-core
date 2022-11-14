import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders

import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

import { User } from '../auth'
import { Validations } from '../validation/validations'
import { RecordFactory } from './factory'
import { RecordUpdater } from './recordUpdater'

let user: User

describe('RecordUpdater - node create', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Root entity creation', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('attribute_with_default').defaultValue('1'),
        integerDef('dependent_attribute').defaultValue('attribute_with_default + 2')
      )
    ).build()

    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ survey, record })
    expect(updateResult).not.toBeNull()

    record = updateResult.record

    // check nodes are created
    const rootEntity = TestUtils.getNodeByPath({ survey, record, path: 'root_entity' })
    expect(rootEntity).not.toBeNull()

    const identifier = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.identifier' })
    expect(identifier).not.toBeNull()

    const attributeWithDefault = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.attribute_with_default' })
    expect(attributeWithDefault).not.toBeNull()

    const dependentAttribute = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.dependent_attribute' })
    expect(dependentAttribute).not.toBeNull()

    // check default values applied
    expect(attributeWithDefault.value).toBe(1)
    expect(dependentAttribute.value).toBe(3)

    // check nodes are validated
    const validation = Validations.getValidation(record)
    const identifierValidation = Validations.getFieldValidation(identifier.uuid)(validation)
    expect(identifierValidation.valid).toBeFalsy()
  })
})
