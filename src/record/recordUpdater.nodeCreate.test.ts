import { User } from '../auth'
import { Validations } from '../validation/validations'
import { RecordFactory } from './factory'
import { RecordUpdater } from './recordUpdater'
import { Surveys } from '../survey'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Records } from './records'
import { Nodes } from '../node'

const { category, categoryItem, codeDef, dateDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User

describe('RecordUpdater - node create', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Root entity creation', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('attribute_with_default').defaultValue('1'),
        integerDef('dependent_attribute').defaultValue('attribute_with_default + 2')
      )
    ).build()

    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    expect(updateResult).not.toBeNull()

    record = updateResult.record

    // check nodes are created
    const identifier = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.identifier' })

    const attributeWithDefault = TestUtils.getNodeByPath({
      survey,
      record,
      path: 'root_entity.attribute_with_default',
    })
    expect(attributeWithDefault).not.toBeNull()

    const dependentAttribute = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.dependent_attribute' })

    // check default values applied
    expect(attributeWithDefault.value).toBe(1)
    expect(dependentAttribute.value).toBe(3)

    // check nodes are validated
    const validation = Validations.getValidation(record)
    const identifierValidation = Validations.getFieldValidation(identifier.uuid)(validation)
    expect(identifierValidation.valid).toBeFalsy()
  })

  test('Enumerated entity creation', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('enumerated', codeDef('enumerator', 'enumerating_category').key()).enumerate().multiple()
      )
    )
      .categories(
        category('enumerating_category')
          .levels('level_1')
          .items(categoryItem('1'), categoryItem('2'), categoryItem('3'))
      )
      .build()

    const enumeratingCategory = Surveys.getCategoryByName({ survey, categoryName: 'enumerating_category' })
    if (!enumeratingCategory) throw new Error(`Could not find category enumerating_category`)

    const [enumeratingItem1, enumeratingItem2, enumeratingItem3] = ['1', '2', '3'].map((itemCode) =>
      Surveys.getCategoryItemByCodePaths({
        survey,
        categoryUuid: enumeratingCategory.uuid,
        codePaths: [itemCode],
      })
    )

    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    record = updateResult.record

    const enumerator1 = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.enumerated[0].enumerator' })
    expect(enumerator1.value?.itemUuid).toEqual(enumeratingItem1?.uuid)

    const enumerator2 = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.enumerated[1].enumerator' })
    expect(enumerator2.value?.itemUuid).toEqual(enumeratingItem2?.uuid)

    const enumerator3 = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.enumerated[2].enumerator' })
    expect(enumerator3.value?.itemUuid).toEqual(enumeratingItem3?.uuid)

    // expect only 3 enumerated nodes
    const enumerator4 = TestUtils.findNodeByPath({ survey, record, path: 'root_entity.enumerated[3].enumerator' })
    expect(enumerator4).toBeUndefined()
  })

  test('Applicability initialization', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        dateDef('source_attribute'),
        entityDef(
          'child_entity',
          integerDef('child_entity_key').key(),
          entityDef('nested_entity', integerDef('nested_entity_key').key())
            .multiple()
            .applyIf('source_attribute > "2025-01-01"')
        ).multiple()
      )
    ).build()

    const childEntityDef = Surveys.getNodeDefByName({ survey, name: 'child_entity' })

    const nestedEntityDef = Surveys.getNodeDefByName({ survey, name: 'nested_entity' })
    const nestedEntityDefUuid = nestedEntityDef.uuid

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 10), attribute('source_attribute', '2024-12-31'))
    ).build()

    const rootNode = Records.getRoot(record)

    // add new child entity: nested entity should not be applicable
    const updateResult = await RecordUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      parentNode: rootNode,
      nodeDef: childEntityDef,
    })
    record = updateResult.record

    const childEntity = TestUtils.getNodeByPath({
      survey,
      record,
      path: 'root_entity.child_entity[0]',
    })
    const secondNestedEntityApplicable = Nodes.isChildApplicable(childEntity, nestedEntityDefUuid)
    expect(secondNestedEntityApplicable).toBeFalsy()
  })
})
