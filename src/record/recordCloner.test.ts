import { Survey } from '../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { TestUtils } from '../tests/testUtils'
import { createTestAdminUser } from '../tests/data'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from './record'
import { RecordCloner } from './recordCloner'

let survey: Survey
let record: Record

describe('Record cloner', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('cluster_boolean_attribute'),
        booleanDef('cluster_attr_excluded').excludeInClone(),
        entityDef('plot', integerDef('plot_id').key(), integerDef('plot_attr_excluded').excludeInClone()).multiple()
      )
    ).build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        attribute('cluster_boolean_attribute', 'true'),
        attribute('cluster_attr_excluded', 'true'),
        entity('plot', attribute('plot_id', 1), attribute('plot_attr_excluded', 10)),
        entity('plot', attribute('plot_id', 2), attribute('plot_attr_excluded', 20)),
        entity('plot', attribute('plot_id', 3), attribute('plot_attr_excluded', 30))
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
    expect(oldRecordUuid).not.toBe(record.uuid)
    expect(oldClusterIdNodeUuid).not.toBe(clusterIdNode.uuid)
  })

  test('(with side effect) excluding values', () => {
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: true })
    expect(clonedRecord).toBe(record)

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
    expect(oldClusterIdNode).not.toBe(clusterIdNode)
    // uuids updated
    expect(oldRecordUuid).not.toBe(record.uuid)
    expect(oldClusterIdNodeUuid).not.toBe(clusterIdNode.uuid)
  })
})
