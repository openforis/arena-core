import { Survey, Surveys } from '../../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from '../record'
import { RecordNodesIndexReader } from './recordNodesIndexReader'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { RecordNodesUpdater } from '../recordNodesUpdater'

const user = createTestAdminUser()
let survey: Survey
let record: Record

describe('Record nodes index', () => {
  beforeAll(async () => {
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
    const index = record._nodesIndex ?? {}

    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    expect(RecordNodesIndexReader.getNodeRootUuid(index)).toBe(clusterNode.uuid)

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    expect(
      RecordNodesIndexReader.getNodeUuidsByParentAndChildDef({
        parentNodeUuid: clusterNode.uuid,
        childDefUuid: plotDef.uuid,
      })(index)
    ).toEqual([plotNode1.uuid, plotNode2.uuid, plotNode3.uuid])
  })

  test('Record nodes index update (nodes added)', () => {
    const index = record._nodesIndex ?? {}

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    const updateResult = RecordNodesUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      parentNode: clusterNode,
      nodeDef: plotDef,
    })
    const { nodes: nodesUpdated } = updateResult

    const insertedPlot = Object.values(nodesUpdated).find((nodeInserted) => nodeInserted.nodeDefUuid === plotDef.uuid)

    expect(insertedPlot).not.toBeNull()

    if (!insertedPlot) throw new Error('inserted plot is undefined')

    const indexUpdated = RecordNodesIndexUpdater.addNodes(nodesUpdated)(index)

    expect(
      RecordNodesIndexReader.getNodeUuidsByParentAndChildDef({
        parentNodeUuid: clusterNode.uuid,
        childDefUuid: plotDef.uuid,
      })(indexUpdated)
    ).toEqual([plotNode1.uuid, plotNode2.uuid, plotNode3.uuid, insertedPlot.uuid])
  })

  test('Record nodes index update (nodes deleted)', () => {
    const index = record._nodesIndex ?? {}

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    const indexUpdated = RecordNodesIndexUpdater.removeNode(plotNode3)(index)

    expect(
      RecordNodesIndexReader.getNodeUuidsByParentAndChildDef({
        parentNodeUuid: clusterNode.uuid,
        childDefUuid: plotDef.uuid,
      })(indexUpdated)
    ).toEqual([plotNode1.uuid, plotNode2.uuid])
  })
})
