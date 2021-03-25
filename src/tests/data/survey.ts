import { User } from '../../auth'
import {
  category,
  categoryItem,
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
  )
    .categories(
      category('simple_category', categoryItem('1'), categoryItem('2'), categoryItem('3')),
      category(
        'hierarchical_category',
        categoryItem('1')
          .extra({ prop1: 'Extra prop1 item 1', prop2: 'Extra prop2 item 1' })
          .item(categoryItem('1').extra({ prop1: 'Extra prop1 item 1-1', prop2: 'Extra prop2 item 1-1' })),
        categoryItem('2')
          .extra({ prop1: 'Extra prop1 item 2', prop2: 'Extra prop2 item 2' })
          .item(categoryItem('1').extra({ prop1: 'Extra prop1 item 2-1', prop2: 'Extra prop2 item 2-1' }))
          .item(categoryItem('2').extra({ prop1: 'Extra prop1 item 2-2', prop2: 'Extra prop2 item 2-2' }))
          .item(categoryItem('3').extra({ prop1: 'Extra prop1 item 2-3', prop2: 'Extra prop2 item 2-3' })),
        categoryItem('3')
          .extra({ prop1: 'Extra prop1 item 3', prop2: 'Extra prop2 item 3' })
          .item(categoryItem('3a').extra({ prop1: 'Extra prop1 item 3a', prop2: 'Extra prop2 item 3a' }))
      ).levels('level_1', 'level_2')
    )
    .build()
