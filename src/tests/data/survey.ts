import { User } from '../../auth'
import { Survey } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../builder/surveyBuilder'

const {
  category,
  categoryItem,
  coordinateDef,
  dateDef,
  decimalDef,
  entityDef,
  integerDef,
  taxon,
  taxonDef,
  taxonomy,
  textDef,
  timeDef,
} = SurveyObjectBuilders

export const createTestSurvey = (params: { user: User }): Survey =>
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
        coordinateDef('plot_location'),
        integerDef('plot_multiple_number').multiple(),
        entityDef(
          'tree',
          integerDef('tree_id').key(),
          integerDef('tree_height'),
          decimalDef('dbh'),
          taxonDef('tree_species', 'trees')
        ).multiple()
      ).multiple()
    )
  )
    .categories(
      category('simple_category').items(categoryItem('1'), categoryItem('2'), categoryItem('3')),
      category('hierarchical_category')
        .levels('level_1', 'level_2')
        .items(
          categoryItem('1')
            .extra({ prop1: 'Extra prop1 item 1', prop2: 'Extra prop2 item 1' })
            .items(categoryItem('1').extra({ prop1: 'Extra prop1 item 1-1', prop2: 'Extra prop2 item 1-1' })),
          categoryItem('2')
            .extra({ prop1: 'Extra prop1 item 2', prop2: 'Extra prop2 item 2' })
            .items(
              categoryItem('1').extra({ prop1: 'Extra prop1 item 2-1', prop2: 'Extra prop2 item 2-1' }),
              categoryItem('2').extra({ prop1: 'Extra prop1 item 2-2', prop2: 'Extra prop2 item 2-2' }),
              categoryItem('3').extra({ prop1: 'Extra prop1 item 2-3', prop2: 'Extra prop2 item 2-3' })
            ),
          categoryItem('3')
            .extra({ prop1: 'Extra prop1 item 3', prop2: 'Extra prop2 item 3' })
            .items(categoryItem('3a').extra({ prop1: 'Extra prop1 item 3a', prop2: 'Extra prop2 item 3a' }))
        ),
      category('sampling_point')
        .levels('cluster', 'plot')
        .items(
          categoryItem('11')
            .extra({ location: 'SRID=EPSG:4326;POINT(12.89463 42.00048)' })
            .items(
              categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(12.88963 42.00548)' }),
              categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(12.88963 41.99548)' }),
              categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(12.89963 42.00548)' }),
              categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(12.89963 41.99548)' })
            ),
          categoryItem('12')
            .extra({ location: 'SRID=EPSG:4326;POINT(12.99463 42.00048)' })
            .items(
              categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(12.98963 42.00548)' }),
              categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(12.98963 41.99548)' }),
              categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(12.99963 42.00548)' }),
              categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(12.99963 41.99548)' })
            ),
          categoryItem('13')
            .extra({ location: 'SRID=EPSG:4326;POINT(13.09463 42.00048)' })
            .items(
              categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(13.08963 42.00548)' }),
              categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(13.08963 41.99548)' }),
              categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(13.09963 42.00548)' }),
              categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(13.09963 41.99548)' })
            )
        )
    )
    .taxonomies(
      taxonomy('trees').taxa(
        taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
          .vernacularName('eng', 'Mahogany')
          .vernacularName('swa', 'Mbambakofi')
          .extra({ max_height: '200', max_dbh: '30' }),
        taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis').extra({ max_height: '300', max_dbh: '40' })
      )
    )
    .build()
