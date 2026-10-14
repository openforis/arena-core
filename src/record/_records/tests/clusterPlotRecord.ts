import { Survey } from '../../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../../tests/data'
import { ArenaRecord } from '../../record'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

// survey with a cluster (key cluster_id) and multiple plots (key plot_id); record with 2 plots
export const createClusterPlotSurveyAndRecord = async (): Promise<{ survey: Survey; record: ArenaRecord }> => {
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
      entity('plot', attribute('plot_id', 2))
    )
  ).build()

  return { survey, record }
}
