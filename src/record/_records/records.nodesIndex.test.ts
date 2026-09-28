import { beforeAll, describe, test, expect } from '@jest/globals'

import { Survey, Surveys } from '../../survey'

import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Node } from '../../node'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { Record } from '../record'
import { RecordNodesUpdater } from '../recordNodesUpdater'
import { Records } from '../records'
import { RecordNodesIndexReader } from './recordNodesIndexReader'
import { RecordNodesIndexUpdater } from './recordNodesIndexUpdater'

const user = createTestAdminUser()
let survey: Survey
let record: Record

describe('Record nodes index', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
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
    expect(RecordNodesIndexReader.getNodeRootInternalId(index)).toBe(clusterNode.iId)

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    expect(
      RecordNodesIndexReader.getNodeInternalIdsByParentAndChildDef({
        parentNodeInternalId: clusterNode.iId,
        childDefUuid: plotDef.uuid,
      })(index)
    ).toEqual([plotNode1.iId, plotNode2.iId, plotNode3.iId])
  })

  test('Record nodes index update (nodes added)', async () => {
    const index = record._nodesIndex ?? {}

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    const updateResult = await RecordNodesUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      parentNode: clusterNode,
      nodeDef: plotDef,
    })
    const { nodes: nodesUpdated } = updateResult

    const insertedPlot: Node | undefined = Object.values(nodesUpdated).find(
      (nodeInserted) => nodeInserted.nodeDefUuid === plotDef.uuid
    )

    expect(insertedPlot).not.toBeNull()

    if (!insertedPlot) throw new Error('inserted plot is undefined')

    const indexUpdated = RecordNodesIndexUpdater.addNodes(nodesUpdated)(index)

    expect(
      RecordNodesIndexReader.getNodeInternalIdsByParentAndChildDef({
        parentNodeInternalId: clusterNode.iId,
        childDefUuid: plotDef.uuid,
      })(indexUpdated)
    ).toEqual([plotNode1.iId, plotNode2.iId, plotNode3.iId, insertedPlot.iId])
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
      RecordNodesIndexReader.getNodeInternalIdsByParentAndChildDef({
        parentNodeInternalId: clusterNode.iId,
        childDefUuid: plotDef.uuid,
      })(indexUpdated)
    ).toEqual([plotNode1.iId, plotNode2.iId])
  })

  test('Record nodes index update without side effect leaves the original index unchanged', () => {
    const index = record._nodesIndex ?? {}
    const indexSnapshot = structuredClone(index)

    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNodeNew: Node = { ...plotNode2, iId: 1000 }

    RecordNodesIndexUpdater.addNode(plotNodeNew)(index)
    RecordNodesIndexUpdater.removeNode(plotNode2)(index)

    expect(index).toEqual(indexSnapshot)
  })

  test('Record nodes index keeps internal ids sorted and unique', () => {
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotNode3 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[2]' })

    // start from an index containing only plot 3, then add plot 1 (lower internal id) and plot 3 again
    let index = RecordNodesIndexUpdater.addNodes({ [clusterNode.iId]: clusterNode, [plotNode3.iId]: plotNode3 })({})
    index = RecordNodesIndexUpdater.addNode(plotNode1)(index)
    index = RecordNodesIndexUpdater.addNode(plotNode3)(index)
    index = RecordNodesIndexUpdater.addNode(plotNode2, true)(index)

    const getPlotInternalIds = () =>
      RecordNodesIndexReader.getNodeInternalIdsByParentAndChildDef({
        parentNodeInternalId: clusterNode.iId,
        childDefUuid: plotDef.uuid,
      })(index)

    expect(getPlotInternalIds()).toEqual([plotNode1.iId, plotNode2.iId, plotNode3.iId])
    expect(RecordNodesIndexReader.getNodeInternalIdsByDef(plotDef.uuid)(index)).toEqual([
      plotNode1.iId,
      plotNode2.iId,
      plotNode3.iId,
    ])

    // removing all the children removes the empty lists
    index = RecordNodesIndexUpdater.removeNodes([plotNode1, plotNode2, plotNode3])(index)
    expect(getPlotInternalIds()).toEqual([])
    expect(index.nodesByParentAndChildDef?.[clusterNode.iId]).toBeUndefined()
    expect(index.nodesByDef?.[plotDef.uuid]).toBeUndefined()
  })

  test('Records.addNodes supports a large number of nodes', () => {
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const nodesCount = 200_000
    const firstInternalId = (record.lastNodeInternalId ?? 0) + 1
    const nodes: { [iId: number]: Node } = {}
    for (let iId = firstInternalId; iId < firstInternalId + nodesCount; iId++) {
      nodes[iId] = { iId, pIId: clusterNode.iId, nodeDefUuid: plotDef.uuid, recordUuid: record.uuid }
    }
    const recordUpdated = Records.addNodes(nodes)(record)

    expect(recordUpdated.lastNodeInternalId).toBe(firstInternalId + nodesCount - 1)
    expect(Records.getChildren(clusterNode, plotDef.uuid)(recordUpdated)).toHaveLength(nodesCount + 3)
  })

  test('Node hierarchy is derived from parent internal ids', () => {
    const clusterNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster' })
    const plotNode1 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0]' })
    const plotNode2 = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[1]' })
    const plotIdNode = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0].plot_id' })

    expect(Records.getNodeHierarchy(clusterNode)(record)).toEqual([])
    expect(Records.getNodeHierarchy(plotIdNode)(record)).toEqual([clusterNode.iId, plotNode1.iId])
    expect(Records.getNodeDepth(plotIdNode)(record)).toBe(2)
    expect(Records.isDescendantOf({ record, node: plotIdNode, ancestor: plotNode1 })).toBe(true)
    expect(Records.isDescendantOf({ record, node: plotIdNode, ancestor: clusterNode })).toBe(true)
    expect(Records.isDescendantOf({ record, node: plotIdNode, ancestor: plotNode2 })).toBe(false)
  })
})
