import { User } from '../../auth'
import { Record } from '../../record'
import { DEFAULT_SRS } from '../../srs'
import { Survey } from '../../survey'
import { RecordBuilder, RecordNodeBuilders } from '../builder/recordBuilder'

const { attribute, entity } = RecordNodeBuilders

export const createTestRecord = (params: { user: User; survey: Survey }): Record =>
  new RecordBuilder(
    params.user,
    params.survey,
    entity(
      'cluster',
      attribute('cluster_id', 12),
      attribute('cluster_accessibility', '0'),
      attribute('cluster_location', {
        srs: DEFAULT_SRS.code,
        x: 41.883012,
        y: 12.489056,
      }),
      attribute('cluster_distance', 18),
      attribute('cluster_region', '2'),
      attribute('visit_date', '2021-01-01'),
      attribute('visit_time', '10:30'),
      attribute('gps_model', 'ABC-123-xyz'),
      attribute('remarks', 'No issues found'),
      entity(
        'plot',
        attribute('plot_id', 1),
        attribute('plot_location', {
          srs: DEFAULT_SRS.code,
          x: 41.803012,
          y: 12.409056,
        }),
        attribute('plot_multiple_number', 10),
        attribute('plot_multiple_number', 20),
        entity(
          'tree',
          attribute('tree_id', 1),
          attribute('tree_height', 10),
          attribute('dbh', 7),
          attribute('tree_species', {
            code: 'AFZ/QUA',
            scientificName: 'Afzelia quanzensis',
          })
        ),
        entity('tree', attribute('tree_id', 2), attribute('tree_height', 11), attribute('dbh', 10.123))
      ),
      entity(
        'plot',
        attribute('plot_id', 2),
        attribute('plot_location', {
          srs: DEFAULT_SRS.code,
          x: 41.823012,
          y: 12.409056,
        }),
        entity('tree', attribute('tree_id', 1), attribute('tree_height', 12), attribute('dbh', 18)),
        entity(
          'tree',
          attribute('tree_id', 2),
          attribute('tree_height', 10),
          attribute('dbh', 15),
          attribute('tree_species', {
            code: 'OLE/CAP',
            scientificName: 'Olea capensis',
          })
        ),
        entity('tree', attribute('tree_id', 3), attribute('tree_height', 30), attribute('dbh', 20))
      ),
      entity(
        'plot',
        attribute('plot_id', 3),
        attribute('plot_location', {
          srs: DEFAULT_SRS.code,
          x: 42.00548,
          y: 12.89963,
        }),
        attribute('plot_multiple_number', 30),
        entity('tree', attribute('tree_id', 1), attribute('tree_height', 13), attribute('dbh', 19)),
        entity('tree', attribute('tree_id', 2), attribute('tree_height', 10), attribute('dbh', 15)),
        entity('tree', attribute('tree_id', 3), attribute('tree_height', 11), attribute('dbh', 16)),
        entity('tree', attribute('tree_id', 4), attribute('tree_height', 10), attribute('dbh', 7)),
        entity('tree', attribute('tree_id', 5), attribute('tree_height', 33), attribute('dbh', 22))
      )
    )
  ).build()
