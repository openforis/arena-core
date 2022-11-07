import { User } from '../../auth'
import { ExtraPropDataType } from '../../extraProp'
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
        .extraProps({
          prop1: { key: 'prop1', dataType: ExtraPropDataType.text },
          prop2: { key: 'prop2', dataType: ExtraPropDataType.text },
          prop3: { key: 'prop3', dataType: ExtraPropDataType.number },
        })
        .items(
          categoryItem('1')
            .extra({ prop1: 'Extra prop1 item 1', prop2: 'Extra prop2 item 1', prop3: 1 })
            .items(categoryItem('1').extra({ prop1: 'Extra prop1 item 1-1', prop2: 'Extra prop2 item 1-1', prop3: 2 })),
          categoryItem('2')
            .extra({ prop1: 'Extra prop1 item 2', prop2: 'Extra prop2 item 2', prop3: 4 })
            .items(
              categoryItem('1').extra({ prop1: 'Extra prop1 item 2-1', prop2: 'Extra prop2 item 2-1', prop3: 11 }),
              categoryItem('2').extra({ prop1: 'Extra prop1 item 2-2', prop2: 'Extra prop2 item 2-2', prop3: 12 }),
              categoryItem('3').extra({ prop1: 'Extra prop1 item 2-3', prop2: 'Extra prop2 item 2-3', prop3: 13 })
            ),
          categoryItem('3')
            .extra({ prop1: 'Extra prop1 item 3', prop2: 'Extra prop2 item 3', prop3: 21 })
            .items(categoryItem('3a').extra({ prop1: 'Extra prop1 item 3a', prop2: 'Extra prop2 item 3a', prop3: 22 }))
        ),
      category('sampling_point')
        .levels('cluster', 'plot')
        .extraProps({
          location: { key: 'location', dataType: ExtraPropDataType.geometryPoint },
        })
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
      taxonomy('trees')
        .extraProps({
          max_height: { key: 'max_height', dataType: ExtraPropDataType.number },
          max_dbh: { key: 'max_dbh', dataType: ExtraPropDataType.number },
        })
        .taxa(
          taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
            .vernacularName('eng', 'Mahogany')
            .vernacularName('swa', 'Mbambakofi')
            .extra({ max_height: 200, max_dbh: 30 }),
          taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis').extra({ max_height: 300, max_dbh: '40' })
        )
    )
    .build()
