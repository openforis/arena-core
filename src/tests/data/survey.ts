import { User } from '../../auth'
import {
  coordinateDef,
  dateDef,
  decimalDef,
  entityDef,
  integerDef,
  SurveyBuilder,
  taxonDef,
  textDef,
  timeDef,
} from '../builder/surveyBuilder'

export const createTestSurvey = (params: { user: User }) =>
  new SurveyBuilder(
    params.user,
    entityDef(
      'cluster',
      integerDef('cluster_id').key(),
      coordinateDef('cluster_location'),
      integerDef('cluster_distance'),
      dateDef('visit_date'),
      timeDef('visit_time'),
      textDef('gps_model'),
      textDef('remarks'),
      entityDef(
        'plot',
        integerDef('plot_id').key(),
        integerDef('plot_multiple_number').multiple(),
        entityDef(
          'tree',
          integerDef('tree_id').key(),
          integerDef('tree_height'),
          decimalDef('dbh'),
          taxonDef('tree_species')
        ).multiple()
      ).multiple()
    )
  ).build()
