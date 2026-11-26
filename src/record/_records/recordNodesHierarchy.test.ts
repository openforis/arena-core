import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaRecordNode } from '../../node'
import { ArenaSurvey } from '../../survey'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { RecordCloner } from '../recordCloner'
import { Records } from '../records'
import * as RecordNodesHierarchy from './recordNodesHierarchy'
import { createClusterPlotSurveyAndRecord } from './tests/clusterPlotRecord'

const newNode = (uuid: string, parentUuid?: string): ArenaRecordNode =>
  ({ uuid, parentUuid, nodeDefUuid: `def-${uuid}`, recordUuid: 'record-1' }) as ArenaRecordNode

const toNodesByUuid = (nodes: ArenaRecordNode[]) => Object.fromEntries(nodes.map((node) => [node.uuid, node]))

describe('RecordNodesHierarchy', () => {
  const root = newNode('root')
  const plot = newNode('plot', 'root')
  const tree = newNode('tree', 'plot')
  const treeAttr = newNode('tree-attr', 'tree')
  const nodesByUuid = toNodesByUuid([root, plot, tree, treeAttr])

  test('getAncestorUuids returns the ancestors going up the parent uuids, root first', () => {
    expect(RecordNodesHierarchy.getAncestorUuids(root, nodesByUuid)).toEqual([])
    expect(RecordNodesHierarchy.getAncestorUuids(treeAttr, nodesByUuid)).toEqual(['root', 'plot', 'tree'])
  })

  test('getAncestorUuids stops at the first ancestor not found', () => {
    expect(RecordNodesHierarchy.getAncestorUuids(treeAttr, toNodesByUuid([tree, treeAttr]))).toEqual(['plot', 'tree'])
  })

  test('isDescendantOf', () => {
    expect(RecordNodesHierarchy.isDescendantOf(treeAttr, 'root', nodesByUuid)).toBe(true)
    expect(RecordNodesHierarchy.isDescendantOf(treeAttr, 'plot', nodesByUuid)).toBe(true)
    expect(RecordNodesHierarchy.isDescendantOf(plot, 'tree', nodesByUuid)).toBe(false)
    expect(RecordNodesHierarchy.isDescendantOf(root, 'root', nodesByUuid)).toBe(false)
  })

  test('createNodeDepthGetter', () => {
    const getDepth = RecordNodesHierarchy.createNodeDepthGetter(nodesByUuid)
    expect([root, plot, tree, treeAttr].map(getDepth)).toEqual([0, 1, 2, 3])
    // parent not found: only the known level is counted
    expect(RecordNodesHierarchy.createNodeDepthGetter({})(treeAttr)).toBe(1)
  })
})

// the record functions don't need the node meta hierarchy (no longer stored)
describe('Record nodes without meta hierarchy', () => {
  let survey: ArenaSurvey
  let record: ArenaRecord

  const getNode = (path: string): ArenaRecordNode => TestUtils.getNodeByPath({ survey, record, path })

  beforeAll(async () => {
    const { survey: surveyCreated, record: recordCreated } = await createClusterPlotSurveyAndRecord()
    survey = surveyCreated
    const nodes = Object.fromEntries(
      Object.entries(recordCreated.nodes ?? {}).map(([uuid, node]) => [uuid, { ...node, meta: {} }])
    )
    record = { ...recordCreated, nodes, _nodesIndex: undefined }
  }, 10000)

  test('getAncestorUuids', () => {
    const cluster = getNode('cluster')
    const plot2 = getNode('cluster.plot[1]')
    expect(Records.getAncestorUuids(getNode('cluster.plot[1].plot_id'))(record)).toEqual([cluster.uuid, plot2.uuid])
  })

  test('isNodeDescendantOf', () => {
    const plotId1 = getNode('cluster.plot[0].plot_id')
    expect(Records.isNodeDescendantOf(plotId1, getNode('cluster'))(record)).toBe(true)
    expect(Records.isNodeDescendantOf(plotId1, getNode('cluster.plot[0]'))(record)).toBe(true)
    expect(Records.isNodeDescendantOf(plotId1, getNode('cluster.plot[1]'))(record)).toBe(false)
  })

  test('cloneRecord keeps the hierarchy of the nodes', () => {
    const { record: recordCloned } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0' })
    const nodesCloned = Records.getNodesArray(recordCloned)
    expect(nodesCloned).toHaveLength(Records.getNodesArray(record).length)
    const root = Records.getRoot(recordCloned)!
    for (const node of nodesCloned) {
      if (node.uuid === root.uuid) continue
      expect(Records.getAncestorUuids(node)(recordCloned)[0]).toBe(root.uuid)
    }
  })
})
