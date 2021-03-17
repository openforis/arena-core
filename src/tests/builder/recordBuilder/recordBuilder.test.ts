import { Records } from '../../../record'
import { attribute, entity } from '.'
import { UserFactory } from '../../../auth'
import { entityDef, integerDef, SurveyBuilder } from '../surveyBuilder'
import { RecordBuilder } from './recordBuilder'
import { Surveys } from '../../../survey'

describe('RecordBuilder', () => {
  test('simple record build', () => {
    const user = UserFactory.createInstance({ email: 'test@arena.org', name: 'test' })

    const survey = new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_id').key()).multiple())
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 1)),
        entity('plot', attribute('plot_id', 2)),
        entity('plot', attribute('plot_id', 3))
      )
    ).build()

    expect(record).toBeDefined()
    expect(record.nodes).toBeDefined()
    const nodes = record.nodes || {}
    expect(Object.entries(nodes).length).toBe(8)

    const cluster = Records.getRoot(record)
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plots = Records.getChildren({ record, parentNode: cluster, childDefUuid: plotDef.uuid })
    expect(plots.length).toBe(3)

    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const plot2 = plots[1]
    const plotId2 = Records.getChild({ record, parentNode: plot2, childDefUuid: plotIdDef.uuid })
    expect(plotId2).toBeDefined()
    expect(plotId2.value).toBe(2)
  })
})
