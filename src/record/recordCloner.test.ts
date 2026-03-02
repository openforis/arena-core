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

describe('Record cloner', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('cluster_boolean_attribute'),
        booleanDef('cluster_attr_excluded').excludeInClone(),
        codeDef('parent_code', 'hierarchical_category'),
        codeDef('dependent_code', 'hierarchical_category').parentCodeAttribute('parent_code'),
        codeDef('parent_code_excluded', 'hierarchical_category').excludeInClone(),
        codeDef('dependent_code_excluded', 'hierarchical_category').parentCodeAttribute('parent_code_excluded'),
        entityDef('plot', integerDef('plot_id').key(), integerDef('plot_attr_excluded').excludeInClone()).multiple()
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

    const categoryItem1a = TestUtils.getCategoryItem({
      survey,
      categoryName: 'hierarchical_category',
      codePaths: ['1', '1a'],
    })
    const categoryItem2b = TestUtils.getCategoryItem({
      survey,
      categoryName: 'hierarchical_category',
      codePaths: ['2', '2b'],
    })

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        attribute('cluster_boolean_attribute', 'true'),
        attribute('cluster_attr_excluded', 'true'),
        attribute('parent_code', '1'),
        attribute('dependent_code', { itemUuid: categoryItem1a.uuid }),
        attribute('parent_code_excluded', '2'),
        attribute('dependent_code_excluded', { itemUuid: categoryItem2b.uuid }),
        entity('plot', attribute('plot_id', 1), attribute('plot_attr_excluded', 10)),
        entity('plot', attribute('plot_id', 2), attribute('plot_attr_excluded', 20)),
        entity('plot', attribute('plot_id', 3), attribute('plot_attr_excluded', 30))
      )
    ).build()
  }, 10000)

  test('(with side effect) UUIDs updated', () => {
    const oldRecordUuid = record.uuid
    const oldClusterIdNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster_id' })
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: true })

    const clusterIdNode = TestUtils.getNodeByPath({ survey, record: clonedRecord, path: 'cluster_id' })

    // side effect: reference to the same objects is kept
    expect(clonedRecord).toBe(record)
    expect(clonedRecord.nodes).toBe(record.nodes)
    expect(clusterIdNode).toBe(oldClusterIdNode)
    // uuid updated
    expect(clonedRecord.uuid).not.toBe(oldRecordUuid)
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
    const { record: clonedRecord } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0', sideEffect: false })

    const clusterIdNode = TestUtils.getNodeByPath({ survey, record: clonedRecord, path: 'cluster_id' })

    // side effect: reference to the same objects is not kept
    expect(clonedRecord).not.toBe(record)
    expect(clonedRecord.nodes).not.toBe(record.nodes)
    expect(clusterIdNode).not.toBe(oldClusterIdNode)
    // uuid updated
    expect(clonedRecord.uuid).not.toBe(oldRecordUuid)
  })
})
