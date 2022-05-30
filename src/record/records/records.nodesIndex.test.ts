import { Survey } from '../../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from '../record'
import { RecordNodesIndexReader } from './recordNodesIndexReader'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'

let survey: Survey
let record: Record

describe('Record nodes index', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key().defaultValue('1').validationExpressions('cluster_id > 0 && cluster_id <= 1000'),
        booleanDef('accessible'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          integerDef('plot_id_double').readOnly().defaultValue('plot_id * 2')
        )
          .multiple()
          .applyIf('accessible')
      )
    ).build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        attribute('accessible', 'true'),
        entity('plot', attribute('plot_id', 1)),
        entity('plot', attribute('plot_id', 2)),
        entity('plot', attribute('plot_id', 3))
      )
    ).build()
  }, 10000)

  test('Record nodes index creation', () => {
    const index = RecordNodesIndexUpdater.addNodes(record.nodes || {})({})
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })

    expect(RecordNodesIndexReader.getNodeRootUuid(index)).toBe(clusterNode.uuid)
  })
})
