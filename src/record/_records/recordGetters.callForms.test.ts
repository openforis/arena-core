import { beforeAll, describe, test, expect } from '@jest/globals'

import { ArenaRecordNode, Nodes } from '../../node'
import { Survey, Surveys } from '../../survey'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { createClusterPlotSurveyAndRecord } from './tests/clusterPlotRecord'

let survey: Survey
let record: ArenaRecord

// record getters take positional parameters first and the record as separate parameter: getter(...params)(record)
describe('Record getters call forms', () => {
  beforeAll(async () => {
    ;({ survey, record } = await createClusterPlotSurveyAndRecord())
  }, 10000)

  const getNode = (path: string): ArenaRecordNode => TestUtils.getNodeByPath({ survey, record, path })
  const getDefUuid = (name: string): string => Surveys.getNodeDefByName({ survey, name }).uuid

  test('positional getters', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const plotDefUuid = getDefUuid('plot')
    const clusterIdDefUuid = getDefUuid('cluster_id')

    expect(Records.getNodeByUuid(plot1.uuid)(record)).toBe(plot1)
    expect(Records.getNodesByUuids([cluster.uuid, plot1.uuid])(record)).toEqual([cluster, plot1])

    const plots = Records.getChildren(cluster, plotDefUuid)(record)
    expect(plots).toHaveLength(2)
    expect(Records.getChildren(cluster)(record)).toEqual(expect.arrayContaining(plots))

    const clusterId = Records.getChild(cluster, clusterIdDefUuid)(record)
    expect(clusterId?.nodeDefUuid).toBe(clusterIdDefUuid)

    expect(Records.getParent(plot1)(record)).toBe(cluster)
    expect(Records.getParent(cluster)(record)).toBeUndefined()
    expect(Records.getNodesByDefUuid(plotDefUuid)(record)).toEqual(plots)
    expect(Records.isNodeEmpty(plot1)(record)).toBe(!Records.isNodeFilledByUser(plot1)(record))
  })

  test('positional getters (ancestors, entity keys)', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const plotId1 = getNode('cluster.plot[0].plot_id')

    expect(Records.getAncestor(plotId1, cluster.nodeDefUuid)(record)).toBe(cluster)
    expect(Records.getAncestor(plotId1, plotId1.nodeDefUuid)(record)).toBe(plotId1)
    expect(Records.getAncestorsAndSelf(plotId1)(record)).toEqual([plotId1, plot1, cluster])
    expect(Records.isNodeApplicable(plotId1)(record)).toBe(true)
    expect(Records.getNodeIndex(plot1)(record)).toBe(0)
    // a copy of the node is found too
    expect(Records.getNodeIndex({ ...getNode('cluster.plot[1]') })(record)).toBe(1)
    expect(Records.getEntityKeyValues(survey, plot1)(record)).toEqual([1])
  })

  test('visitAncestorsAndSelf stops when the visitor returns true', () => {
    const plot1 = getNode('cluster.plot[0]')
    const plotId1 = getNode('cluster.plot[0].plot_id')
    const visited: ArenaRecordNode[] = []
    Records.visitAncestorsAndSelf(plotId1, (node) => {
      visited.push(node)
      return node.uuid === plot1.uuid
    })(record)
    expect(visited).toEqual([plotId1, plot1])

    const visitedAll: ArenaRecordNode[] = []
    Records.visitAncestorsAndSelf(plotId1, (node) => {
      visitedAll.push(node)
    })(record)
    expect(visitedAll).toHaveLength(3)
    expect(Nodes.isRoot(visitedAll[2])).toBe(true)
  })
})
