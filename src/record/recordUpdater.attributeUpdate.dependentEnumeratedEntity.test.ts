import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { User } from '../auth'
import { NodeValueFormatter, NodeValues } from '../node'
import { Survey, Surveys } from '../survey'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Record } from './record'
import { RecordUpdater } from './recordUpdater'

let user: User

const updateAttributeAndExpectDependentEnumeratedKeys = async (params: {
  survey: Survey
  record: Record
  nodePath: string
  value: any
  enumeratedKeysPath: string
  expectedKeys: string[]
}): Promise<Record> => {
  const { survey, record, nodePath, value, enumeratedKeysPath, expectedKeys } = params
  const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: nodePath })

  const updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeUuid: nodeToUpdate.uuid,
    value,
    deleteNotApplicableEnumeratedEntities: true,
  })

  expect(updateResult).not.toBeNull()
  const { record: recordUpdated } = updateResult

  const dependentNodes = TestUtils.findNodesByPath({ survey, record: recordUpdated, path: enumeratedKeysPath })
  expect(dependentNodes).not.toBeNull()

  const valuesFormatted = dependentNodes?.map((node) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    return NodeValueFormatter.format({
      survey,
      cycle: Surveys.getDefaultCycleKey(survey)!,
      nodeDef,
      node,
      value: node.value,
    })
  })
  expect(valuesFormatted).toEqual(expectedKeys)
  return recordUpdated
}

describe('RecordUpdater - attribute update => update dependent enumerated entity', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Dependent Applicable', async () => {
    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('root_key').key(),
        codeDef('parent_code', 'hierarchical_category'),
        entityDef(
          'enumerated_entity',
          codeDef('enumerated_entity_key', 'hierarchical_category').parentCodeAttribute('parent_code').key(),
          integerDef('table_num')
        )
          .multiple()
          .enumerate()
          .applyIf('isNotEmpty("parent_code")')
      )
    )
      .categories(
        category('hierarchical_category')
          .levels('level_1', 'level_2')
          .items(
            categoryItem('1').items(categoryItem('1a')),
            categoryItem('2').items(categoryItem('2a'), categoryItem('2b'), categoryItem('2c')),
            categoryItem('3').items(categoryItem('3a'))
          )
      )
      .build()

    const enumeratingCategory = Surveys.getCategoryByName({ survey, categoryName: 'hierarchical_category' })
    const [item1, item2] = [['1'], ['2']].map((codePaths) =>
      Surveys.getCategoryItemByCodePaths({
        survey,
        categoryUuid: enumeratingCategory!.uuid,
        codePaths,
      })
    )
    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('root_key', 10), attribute('parent_code'))
    ).build()

    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'root_entity.parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item1!.uuid }),
      enumeratedKeysPath: 'root_entity.enumerated_entity.enumerated_entity_key',
      expectedKeys: ['1a'],
    })
    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'root_entity.parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item2!.uuid }),
      enumeratedKeysPath: 'root_entity.enumerated_entity.enumerated_entity_key',
      expectedKeys: ['2a'],
    })
    expect(record).not.toBeNull()
  })
})
