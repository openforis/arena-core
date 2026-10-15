import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaRecordNode } from '../../node'
import { Survey, Surveys } from '../../survey'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { createClusterPlotSurveyAndRecord } from './tests/clusterPlotRecord'

let survey: Survey
let record: ArenaRecord

// node getters return undefined when the node is not found
describe('Record getters: node not found', () => {
  beforeAll(async () => {
    ;({ survey, record } = await createClusterPlotSurveyAndRecord())
  }, 10000)

  const getNode = (path: string): ArenaRecordNode => TestUtils.getNodeByPath({ survey, record, path })

  test('getNodeByUuid', () => {
    expect(Records.getNodeByUuid('not_existing')(record)).toBeUndefined()
  })

  test('getRoot', () => {
    expect(Records.getRoot({ ...record, nodes: {} })).toBeUndefined()
  })

  test('getChild', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const clusterIdDef = Surveys.getNodeDefByName({ survey, name: 'cluster_id' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })

    expect(Records.getChild(cluster, clusterIdDef.uuid)(record)).toBe(getNode('cluster.cluster_id'))
    expect(Records.getChild(plot1, clusterIdDef.uuid)(record)).toBeUndefined()
    // more than one child found: the record is not consistent
    expect(() => Records.getChild(cluster, plotDef.uuid)(record)).toThrow('systemError.record.multipleNodesFound')
  })

  test('getAncestor', () => {
    const cluster = getNode('cluster')
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })

    expect(Records.getAncestor({ node: cluster, ancestorDefUuid: plotDef.uuid })(record)).toBeUndefined()
  })

  test('getDescendant', () => {
    const plot1 = getNode('cluster.plot[0]')
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const clusterIdDef = Surveys.getNodeDefByName({ survey, name: 'cluster_id' })

    expect(Records.getDescendant({ node: plot1, nodeDefDescendant: plotIdDef })(record)).toBe(
      getNode('cluster.plot[0].plot_id')
    )
    expect(Records.getDescendant({ node: plot1, nodeDefDescendant: clusterIdDef })(record)).toBeUndefined()
  })
})
