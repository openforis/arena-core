import { beforeAll, describe, test, expect } from '@jest/globals'

import { NodeValueFormatter, NodeValues } from '../node'
import { Survey, Surveys } from '../survey'
import { createTestAdminUser } from '../tests/data'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { TestUtils } from '../tests/testUtils'
import { Record } from './record'
import { RecordFactory } from './factory'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { booleanDef, category, categoryItem, codeDef, entityDef, integerDef, textDef } = SurveyObjectBuilders
const { attribute, entity } = RecordNodeBuilders

const user = createTestAdminUser()
let survey: Survey
let surveyWithApplyIf: Survey

const initTestSurvey = async () => {
  survey = await new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('root_key').key(),
      integerDef('notes'),
      entityDef('table_source', textDef('source_type'), integerDef('value')).multiple(),
      entityDef(
        'table_sum',
        codeDef('sum_type', 'types').key(),
        integerDef('value_sum')
          .readOnly()
          .defaultValue('sum(table_source[$context.sum_type == source_type].value)')
      )
        .multiple()
        .enumerate()
        .enumeratingItemsExpression('unique(table_source.source_type)')
    )
  )
    .categories(category('types').items(categoryItem('A'), categoryItem('B'), categoryItem('C')))
    .build()

  surveyWithApplyIf = await new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('root_key').key(),
      booleanDef('accessible'),
      entityDef('table_source', textDef('source_type'), integerDef('value')).multiple(),
      entityDef('table_sum', codeDef('sum_type', 'types').key())
        .multiple()
        .enumerate()
        .enumeratingItemsExpression('unique(table_source.source_type)')
        .applyIf('accessible')
    )
  )
    .categories(category('types').items(categoryItem('A'), categoryItem('B')))
    .build()
}

const getTableSumKeys = (params: { survey: Survey; record: Record }): string[] => {
  const { survey: surveyParam, record } = params
  const root = TestUtils.getNodeByPath({ survey: surveyParam, record, path: 'root_entity' })
  const tableSumDef = Surveys.getNodeDefByName({ survey: surveyParam, name: 'table_sum' })
  const sumTypeDef = Surveys.getNodeDefChildren({ survey: surveyParam, nodeDef: tableSumDef }).find(
    (childDef) => childDef.props.name === 'sum_type'
  )!
  const sumEntities = Records.getChildren(root, tableSumDef.uuid)(record)

  return sumEntities.map((entity) => {
    const keyNode = Records.getChild(entity, sumTypeDef.uuid)(record)!
    const nodeDef = Surveys.getNodeDefByUuid({ survey: surveyParam, uuid: keyNode.nodeDefUuid })
    return NodeValueFormatter.format({
      survey: surveyParam,
      cycle: Surveys.getDefaultCycleKey(surveyParam)!,
      nodeDef,
      node: keyNode,
      value: keyNode.value,
    })
  })
}

const getTableSumEntityUuidsByKey = (params: { survey: Survey; record: Record }): Record<string, string> => {
  const { survey: surveyParam, record } = params
  const root = TestUtils.getNodeByPath({ survey: surveyParam, record, path: 'root_entity' })
  const tableSumDef = Surveys.getNodeDefByName({ survey: surveyParam, name: 'table_sum' })
  const sumTypeDef = Surveys.getNodeDefChildren({ survey: surveyParam, nodeDef: tableSumDef }).find(
    (childDef) => childDef.props.name === 'sum_type'
  )!
  const sumEntities = Records.getChildren(root, tableSumDef.uuid)(record)

  return Object.fromEntries(
    sumEntities.map((entity) => {
      const keyNode = Records.getChild(entity, sumTypeDef.uuid)(record)!
      const nodeDef = Surveys.getNodeDefByUuid({ survey: surveyParam, uuid: keyNode.nodeDefUuid })
      const key = NodeValueFormatter.format({
        survey: surveyParam,
        cycle: Surveys.getDefaultCycleKey(surveyParam)!,
        nodeDef,
        node: keyNode,
        value: keyNode.value,
      })
      return [key, entity.uuid]
    })
  )
}

const addTableSourceRow = async (params: { survey: Survey; record: Record; type: string; value: number }): Promise<Record> => {
  const { survey: surveyParam, type, value } = params
  let { record } = params
  const getRoot = () => TestUtils.getNodeByPath({ survey: surveyParam, record, path: 'root_entity' })
  const tableSourceDef = Surveys.getNodeDefByName({ survey: surveyParam, name: 'table_source' })

  const createResult = await RecordUpdater.createNodeAndDescendants({
    user,
    survey: surveyParam,
    record,
    parentNode: getRoot(),
    nodeDef: tableSourceDef,
  })
  record = createResult.record

  const tableSourceEntities = Records.getChildren(getRoot(), tableSourceDef.uuid)(record)
  const entityIndex = tableSourceEntities.length - 1
  const typeDef = Surveys.getNodeDefByName({ survey: surveyParam, name: 'source_type' })
  const valueDef = Surveys.getNodeDefByName({ survey: surveyParam, name: 'value' })
  const typeNode = Records.getChild(tableSourceEntities[entityIndex], typeDef.uuid)(record)!

  let updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey: surveyParam,
    record,
    attributeUuid: typeNode.uuid,
    value: type,
  })
  record = updateResult.record

  const updatedEntity = Records.getChildren(getRoot(), tableSourceDef.uuid)(record)[entityIndex]
  const valueNode = Records.getChild(updatedEntity, valueDef.uuid)(record)!

  updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey: surveyParam,
    record,
    attributeUuid: valueNode.uuid,
    value,
  })
  return updateResult.record
}

const deleteTableSourceEntity = async (params: { survey: Survey; record: Record; index: number }): Promise<Record> => {
  const { survey: surveyParam, index } = params
  let { record } = params
  const tableSourceEntities = TestUtils.findNodesByPath({ survey: surveyParam, record, path: 'table_source' })!
  const updateResult = await RecordUpdater.deleteNode({
    user,
    survey: surveyParam,
    record,
    nodeUuid: tableSourceEntities[index].uuid,
  })
  return updateResult.record
}

describe('RecordUpdater - attribute update => update dependent enumerating items entity', () => {
  beforeAll(async () => {
    await initTestSurvey()
  }, 10000)

  test('Initial record creation -> one row per unique source value', async () => {
    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record

    record = await addTableSourceRow({ survey, record, type: 'A', value: 10 })
    record = await addTableSourceRow({ survey, record, type: 'B', value: 30 })

    expect(getTableSumKeys({ survey, record })).toEqual(['A', 'B'])
  })

  test('Add source row with new value -> one new row added, existing UUIDs unchanged', async () => {
    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record
    record = await addTableSourceRow({ survey, record, type: 'A', value: 10 })
    record = await addTableSourceRow({ survey, record, type: 'B', value: 20 })

    const uuidsBefore = getTableSumEntityUuidsByKey({ survey, record })
    record = await addTableSourceRow({ survey, record, type: 'C', value: 30 })

    expect(getTableSumKeys({ survey, record })).toEqual(['A', 'B', 'C'])
    expect(getTableSumEntityUuidsByKey({ survey, record })).toMatchObject(uuidsBefore)
  })

  test('Remove last source row of a value -> exactly that row removed', async () => {
    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record
    record = await addTableSourceRow({ survey, record, type: 'A', value: 10 })
    record = await addTableSourceRow({ survey, record, type: 'B', value: 20 })

    const uuidsBefore = getTableSumEntityUuidsByKey({ survey, record })
    record = await deleteTableSourceEntity({ survey, record, index: 1 })

    expect(getTableSumKeys({ survey, record })).toEqual(['A'])
    expect(getTableSumEntityUuidsByKey({ survey, record })).toEqual({ A: uuidsBefore.A })
  })

  test('Edit unrelated attribute -> no row change', async () => {
    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record
    record = await addTableSourceRow({ survey, record, type: 'A', value: 10 })

    const uuidsBefore = getTableSumEntityUuidsByKey({ survey, record })
    const keysBefore = getTableSumKeys({ survey, record })

    const notesNode = TestUtils.getNodeByPath({ survey, record, path: 'notes' })
    const updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: notesNode.uuid,
      value: 99,
    })
    record = updateResult.record

    expect(getTableSumKeys({ survey, record })).toEqual(keysBefore)
    expect(getTableSumEntityUuidsByKey({ survey, record })).toEqual(uuidsBefore)
  })

  test('Composability -> value_sum default value computed for incrementally created rows', async () => {
    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record
    record = await addTableSourceRow({ survey, record, type: 'A', value: 10 })
    record = await addTableSourceRow({ survey, record, type: 'A', value: 20 })
    record = await addTableSourceRow({ survey, record, type: 'B', value: 30 })

    const valueSumDef = Surveys.getNodeDefChildren({ survey, nodeDef: Surveys.getNodeDefByName({ survey, name: 'table_sum' }) }).find(
      (childDef) => childDef.props.name === 'value_sum'
    )!
    const root = TestUtils.getNodeByPath({ survey, record, path: 'root_entity' })
    const tableSumDef = Surveys.getNodeDefByName({ survey, name: 'table_sum' })
    const values = Records.getChildren(root, tableSumDef.uuid)(record)
      .map((entity) => Records.getChild(entity, valueSumDef.uuid)(record)?.value)
      .sort((a, b) => Number(a) - Number(b))
    expect(values).toEqual([30, 30])
  })

  test('Toggle entity applyIf false -> true -> rows deleted then recreated filtered', async () => {
    let record = new RecordBuilder(
      user,
      surveyWithApplyIf,
      entity('root_entity', attribute('root_key', 1), attribute('accessible', 'true'))
    ).build()

    record = await addTableSourceRow({ survey: surveyWithApplyIf, record, type: 'A', value: 10 })
    record = await addTableSourceRow({ survey: surveyWithApplyIf, record, type: 'B', value: 20 })
    expect(getTableSumKeys({ survey: surveyWithApplyIf, record })).toEqual(['A', 'B'])

    const accessibleNode = TestUtils.getNodeByPath({ survey: surveyWithApplyIf, record, path: 'accessible' })
    let updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey: surveyWithApplyIf,
      record,
      attributeUuid: accessibleNode.uuid,
      value: 'false',
    })
    record = updateResult.record

    let tableSumEntities = TestUtils.findNodesByPath({ survey: surveyWithApplyIf, record, path: 'table_sum' })
    expect(tableSumEntities?.length).toBe(0)

    updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey: surveyWithApplyIf,
      record,
      attributeUuid: accessibleNode.uuid,
      value: 'true',
    })
    record = updateResult.record

    expect(getTableSumKeys({ survey: surveyWithApplyIf, record })).toEqual(['A', 'B'])
  })
})
