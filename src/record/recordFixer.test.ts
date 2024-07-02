import { Survey } from '../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { TestUtils } from '../tests/testUtils'
import { createTestAdminUser } from '../tests/data'

const { booleanDef, category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from './record'
import { RecordCloner } from './recordCloner'

let survey: Survey
let record: Record

describe('Record fixer', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('cluster_boolean_attribute'),
        entityDef('plot', integerDef('plot_id').key(), integerDef('plot_attr_deleted')).multiple()
      )
    )
      .build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        attribute('cluster_boolean_attribute', 'true'),
        entity('plot', attribute('plot_id', 1), attribute('plot_attr_deleted', 10)),
        entity('plot', attribute('plot_id', 2), attribute('plot_attr_deleted', 20)),
        entity('plot', attribute('plot_id', 3), attribute('plot_attr_deleted', 30))
      )
    ).build()
  }, 10000)

  test('(with side effect) UUIDs updated', () => {
    const oldRecordUuid = record.uuid
    const oldClusterIdNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster_id' })
    const oldClusterIdNodeUuid = oldClusterIdNode.uuid
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: true })

    const clusterIdNode = TestUtils.getNodeByPath({ survey, record: clonedRecord, path: 'cluster_id' })

    // side effect: reference to the same objects is kept
    expect(clonedRecord).toBe(record)
    expect(clonedRecord.nodes).toBe(record.nodes)
    expect(clusterIdNode).toBe(oldClusterIdNode)
    // uuids updated
    expect(clonedRecord.uuid).not.toBe(oldRecordUuid)
    expect(clusterIdNode.uuid).not.toBe(oldClusterIdNodeUuid)
  })

  test('(with side effect) excluding values', () => {
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: true })
    expect(clonedRecord).toBe(record)

    const clusterAttrIncluded = TestUtils.findNodeByPath({ survey, record, path: 'cluster_boolean_attribute' })
    expect(clusterAttrIncluded?.value).not.toBeUndefined()

    const codeAttrIncluded = TestUtils.findNodeByPath({ survey, record, path: 'parent_code' })
    expect(codeAttrIncluded?.value).not.toBeUndefined()

    const codeAttrDependentIncluded = TestUtils.findNodeByPath({ survey, record, path: 'dependent_code' })
    expect(codeAttrDependentIncluded?.value).not.toBeUndefined()

    const codeAttrExcluded = TestUtils.findNodeByPath({ survey, record, path: 'parent_code_excluded' })
    expect(codeAttrExcluded?.value).toBeUndefined()

    const codeAttrDependentExcluded = TestUtils.findNodeByPath({
      survey,
      record,
      path: 'dependent_code_excluded',
    })
    expect(codeAttrDependentExcluded?.value).toBeUndefined()

    const clusterAttrExcluded = TestUtils.findNodeByPath({ survey, record, path: 'cluster_attr_excluded' })
    expect(clusterAttrExcluded?.value).toBeUndefined()

    const plotAttrExcluded = TestUtils.findNodeByPath({ survey, record, path: 'plot[0].plot_attr_excluded' })
    expect(plotAttrExcluded?.value).toBeUndefined()
  })

  test('(without side effect) UUIDs updated', () => {
    const oldRecordUuid = record.uuid
    const oldClusterIdNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster_id' })
    const oldClusterIdNodeUuid = oldClusterIdNode.uuid
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: false })

    const clusterIdNode = TestUtils.getNodeByPath({ survey, record: clonedRecord, path: 'cluster_id' })

    // side effect: reference to the same objects is not kept
    expect(clonedRecord).not.toBe(record)
    expect(clonedRecord.nodes).not.toBe(record.nodes)
    expect(clusterIdNode).not.toBe(oldClusterIdNode)
    // uuids updated
    expect(clonedRecord.uuid).not.toBe(oldRecordUuid)
    expect(clusterIdNode.uuid).not.toBe(oldClusterIdNodeUuid)
  })
})
