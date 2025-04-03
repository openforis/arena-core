import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { booleanDef, category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { NodeValueFormatter, NodeValues } from '../node'
import { Survey, Surveys } from '../survey'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Record } from './record'
import { RecordUpdater } from './recordUpdater'

const user = createTestAdminUser()

const survey = new SurveyBuilder(
  user,
  entityDef(
    'root_entity',
    integerDef('root_key').key(),
    booleanDef('accessible'),
    codeDef('parent_code', 'hierarchical_category'),
    entityDef(
      'enumerated_entity',
      codeDef('enumerated_entity_key', 'hierarchical_category').parentCodeAttribute('parent_code').key(),
      integerDef('table_num')
    )
      .multiple()
      .enumerate()
      .applyIf('accessible')
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

const createRecord = (): Record =>
  new RecordBuilder(
    user,
    survey,
    entity('root_entity', attribute('root_key', 10), attribute('accessible', true), attribute('parent_code'))
  ).build()

let record = createRecord()

const updateAttributeAndExpectDependentEnumeratedKeys = async (params: {
  survey: Survey
  record: Record
  nodePath: string
  value: any
  enumeratedKeysPath: string
  expectedKeys: string[] | undefined
}): Promise<Record> => {
  const { survey, record, nodePath, value, enumeratedKeysPath, expectedKeys } = params
  const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: nodePath })

  const updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeUuid: nodeToUpdate.uuid,
    value,
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
  test('Hieararchical code attribute update -> enumerated entities updated', async () => {
    record = createRecord()

    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item1!.uuid }),
      enumeratedKeysPath: 'enumerated_entity.enumerated_entity_key',
      expectedKeys: ['1a'],
    })
    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item2!.uuid }),
      enumeratedKeysPath: 'enumerated_entity.enumerated_entity_key',
      expectedKeys: ['2a'],
    })
    expect(record).not.toBeNull()
  })
  test('Hieararchical code attribute claered -> enumerated entities deleted', async () => {
    record = createRecord()

    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item1!.uuid }),
      enumeratedKeysPath: 'enumerated_entity.enumerated_entity_key',
      expectedKeys: ['1a'],
    })
    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'parent_code',
      value: null,
      enumeratedKeysPath: 'enumerated_entity.enumerated_entity_key',
      expectedKeys: undefined,
    })
    expect(record).not.toBeNull()
  })

  test('Enumerated entity not applicable -> entities deleted', async () => {
    record = createRecord()

    record = await updateAttributeAndExpectDependentEnumeratedKeys({
      survey,
      record,
      nodePath: 'parent_code',
      value: NodeValues.newCodeValue({ itemUuid: item1!.uuid }),
      enumeratedKeysPath: 'enumerated_entity.enumerated_entity_key',
      expectedKeys: ['1a'],
    })
    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'accessible' })

    const updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: nodeToUpdate.uuid,
      value: false,
    })
    record = updateResult.record

    const dependentNodes = TestUtils.findNodesByPath({ survey, record, path: 'enumerated_entity' })
    expect(dependentNodes).not.toBeNull()
    expect(dependentNodes?.length).toBe(0)
  })
})
