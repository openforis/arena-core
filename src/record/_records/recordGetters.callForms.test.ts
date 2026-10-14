import { beforeAll, describe, test, expect } from '@jest/globals'

import { ArenaRecordNode, Nodes } from '../../node'
import { Survey, Surveys } from '../../survey'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { createClusterPlotSurveyAndRecord } from './tests/clusterPlotRecord'

let survey: Survey
let record: ArenaRecord

// record getters take the parameters first and the record as separate parameter: getter(params)(record);
// the deprecated forms (positional parameters, record inside the parameters) must return the same results
describe('Record getters call forms', () => {
  beforeAll(async () => {
    ;({ survey, record } = await createClusterPlotSurveyAndRecord())
  }, 10000)

  const getNode = (path: string): ArenaRecordNode => TestUtils.getNodeByPath({ survey, record, path })
  const getDefUuid = (name: string): string => Surveys.getNodeDefByName({ survey, name }).uuid

  test('deprecated positional forms return the same results', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const plotDefUuid = getDefUuid('plot')
    const clusterIdDefUuid = getDefUuid('cluster_id')

    expect(Records.getNodeByUuid({ uuid: plot1.uuid })(record)).toBe(plot1)
    expect(Records.getNodeByUuid(plot1.uuid)(record)).toBe(plot1)

    expect(Records.getNodesByUuids({ uuids: [cluster.uuid, plot1.uuid] })(record)).toEqual([cluster, plot1])
    expect(Records.getNodesByUuids([cluster.uuid, plot1.uuid])(record)).toEqual([cluster, plot1])

    const plots = Records.getChildren({ parentNode: cluster, childDefUuid: plotDefUuid })(record)
    expect(plots).toHaveLength(2)
    expect(Records.getChildren(cluster, plotDefUuid)(record)).toEqual(plots)
    expect(Records.getChildren({ parentNode: cluster })(record)).toEqual(Records.getChildren(cluster)(record))

    const clusterId = Records.getChild({ parentNode: cluster, childDefUuid: clusterIdDefUuid })(record)
    expect(Records.getChild(cluster, clusterIdDefUuid)(record)).toBe(clusterId)

    expect(Records.getParent({ node: plot1 })(record)).toBe(cluster)
    expect(Records.getParent(plot1)(record)).toBe(cluster)

    expect(Records.getNodesByDefUuid({ nodeDefUuid: plotDefUuid })(record)).toEqual(plots)
    expect(Records.getNodesByDefUuid(plotDefUuid)(record)).toEqual(plots)

    expect(Records.isNodeFilledByUser({ node: plot1 })(record)).toBe(Records.isNodeFilledByUser(plot1)(record))
    expect(Records.isNodeEmpty({ node: plot1 })(record)).toBe(Records.isNodeEmpty(plot1)(record))
  })

  test('deprecated forms with the record inside the parameters return the same results', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const plotId1 = getNode('cluster.plot[0].plot_id')

    expect(Records.getAncestor({ node: plotId1, ancestorDefUuid: cluster.nodeDefUuid })(record)).toBe(cluster)
    expect(Records.getAncestor({ record, node: plotId1, ancestorDefUuid: cluster.nodeDefUuid })).toBe(cluster)

    const ancestors = Records.getAncestorsAndSelf({ node: plotId1 })(record)
    expect(ancestors).toEqual([plotId1, plot1, cluster])
    expect(Records.getAncestorsAndSelf({ record, node: plotId1 })).toEqual(ancestors)

    expect(Records.getNodeIndex({ node: plot1 })(record)).toBe(0)
    expect(Records.getNodeIndex({ record, node: plot1 })).toBe(0)

    const keyValues = Records.getEntityKeyValues({ survey, entity: plot1 })(record)
    expect(keyValues).toEqual([1])
    expect(Records.getEntityKeyValues({ survey, record, entity: plot1 })).toEqual(keyValues)
  })

  test('visitAncestorsAndSelf stops when the visitor returns true', () => {
    const plot1 = getNode('cluster.plot[0]')
    const plotId1 = getNode('cluster.plot[0].plot_id')
    const visited: ArenaRecordNode[] = []
    Records.visitAncestorsAndSelf({
      node: plotId1,
      visitor: (node) => {
        visited.push(node)
        return node.uuid === plot1.uuid
      },
    })(record)
    expect(visited).toEqual([plotId1, plot1])
  })

  test('visitAncestorsAndSelf (deprecated positional form) stops when stopIfFn returns true', () => {
    const plotId1 = getNode('cluster.plot[0].plot_id')
    const visitedAll: ArenaRecordNode[] = []
    Records.visitAncestorsAndSelf(plotId1, (node) => {
      visitedAll.push(node)
    })(record)
    expect(visitedAll).toHaveLength(3)
    expect(Nodes.isRoot(visitedAll[2])).toBe(true)

    const visited: ArenaRecordNode[] = []
    Records.visitAncestorsAndSelf(
      plotId1,
      (node) => {
        visited.push(node)
      },
      () => visited.length === 2
    )(record)
    expect(visited).toHaveLength(2)
  })
})
