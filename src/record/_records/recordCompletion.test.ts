import { describe, test, expect } from '@jest/globals'

import { Nodes } from '../../node'
import { Records } from '../records'
import { Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { attribute, entity } = RecordNodeBuilders

describe('RecordCompletion', () => {
  test('entity with only non required attributes is 100% complete', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(user, entityDef('cluster', textDef('remarks'))).build()
    const record = new RecordBuilder(user, survey, entity('cluster', attribute('remarks', null))).build()

    expect(Records.getRecordCompletionPercent({ survey, record })).toBe(100)
  })

  test('required attribute filled and not filled', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').required(), textDef('remarks'))
    ).build()

    const filledRecord = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), attribute('remarks', null))
    ).build()
    expect(Records.getRecordCompletionPercent({ survey, record: filledRecord })).toBe(100)

    const emptyRecord = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', null), attribute('remarks', 'a note'))
    ).build()
    expect(Records.getRecordCompletionPercent({ survey, record: emptyRecord })).toBe(0)
  })

  test('multiple attribute completion is based on min count', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', textDef('samples').multiple().minCount('2'))
    ).build()

    const record = new RecordBuilder(user, survey, entity('cluster', attribute('samples', 'a'))).build()

    // 1 out of 2 required repetitions filled => 50%
    expect(Records.getRecordCompletionPercent({ survey, record })).toBe(50)
  })

  test('multiple entity completion is based on min count and recurses into descendants', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key().required(),
        entityDef('plot', integerDef('plot_id').required()).multiple().minCount('2')
      )
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), entity('plot', attribute('plot_id', 1)))
    ).build()

    // total units: cluster_id (1) + plot min count (2) = 3
    // filled units: cluster_id (1) + plot[0] filled (1) + plot[1] missing (0) = 2
    expect(Records.getRecordCompletionPercent({ survey, record })).toBeCloseTo((2 / 3) * 100, 2)

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const cluster = Records.getRoot(record)!
    expect(Records.getEntityCompletionPercent({ survey, record, entity: cluster })).toBeCloseTo((2 / 3) * 100, 2)

    const plot0 = Records.getChildren(cluster, plotDef.uuid)(record)[0]
    expect(Records.getEntityCompletionPercent({ survey, record, entity: plot0 })).toBe(100)
  })

  test('non applicable required attribute is excluded from completion', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').required(), textDef('remarks').required())
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), attribute('remarks', null))
    ).build()

    const remarksDef = Surveys.getNodeDefByName({ survey, name: 'remarks' })
    let cluster = Records.getRoot(record)!
    cluster = Nodes.assocChildApplicability(cluster, remarksDef.uuid, false)
    const recordWithNonApplicableRemarks = Records.addNode(cluster)(record)

    expect(Records.getRecordCompletionPercent({ survey, record: recordWithNonApplicableRemarks })).toBe(100)
  })
})
