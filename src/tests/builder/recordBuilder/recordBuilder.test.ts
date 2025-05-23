import { Records } from '../../../record'
import { SurveyBuilder, SurveyObjectBuilders } from '../surveyBuilder'
import { RecordBuilder } from './recordBuilder'
import { RecordNodeBuilders } from '.'
import { Surveys } from '../../../survey'
import { createTestAdminUser } from '../../data'

const { entityDef, integerDef } = SurveyObjectBuilders
const { attribute, entity } = RecordNodeBuilders

describe('RecordBuilder', () => {
  test('simple record build', async () => {
    const user = createTestAdminUser()

    const survey = await new SurveyBuilder(
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
    expect(cluster).toBeDefined()
    if (!cluster) throw new Error('Root node not found')

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plots = Records.getChildren(cluster, plotDef.uuid)(record)
    expect(plots.length).toBe(3)

    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const plot1 = plots[0]
    const plotId1 = Records.getChild(plot1, plotIdDef.uuid)(record)
    expect(plotId1).toBeDefined()
    expect(plotId1.value).toBe(1)

    const plot2 = plots[1]
    const plotId2 = Records.getChild(plot2, plotIdDef.uuid)(record)
    expect(plotId2).toBeDefined()
    expect(plotId2.value).toBe(2)
  })
})
