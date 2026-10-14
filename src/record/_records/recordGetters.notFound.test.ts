import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaRecordNode } from '../../node'
import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const user = createTestAdminUser()
let survey: Survey
let record: ArenaRecord

// node getters return undefined when the node is not found
describe('Record getters: node not found', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_id').key()).multiple())
    ).build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 1)),
        entity('plot', attribute('plot_id', 2))
      )
    ).build()
  }, 10000)

  const getNode = (path: string): ArenaRecordNode => TestUtils.getNodeByPath({ survey, record, path })

  test('getNodeByUuid', () => {
    expect(Records.getNodeByUuid({ uuid: 'not_existing' })(record)).toBeUndefined()
  })

  test('getRoot', () => {
    expect(Records.getRoot({ ...record, nodes: {} })).toBeUndefined()
  })

  test('getChild', () => {
    const cluster = getNode('cluster')
    const plot1 = getNode('cluster.plot[0]')
    const clusterIdDef = Surveys.getNodeDefByName({ survey, name: 'cluster_id' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })

    expect(Records.getChild({ parentNode: cluster, childDefUuid: clusterIdDef.uuid })(record)).toBe(
      getNode('cluster.cluster_id')
    )
    expect(Records.getChild({ parentNode: plot1, childDefUuid: clusterIdDef.uuid })(record)).toBeUndefined()
    // more than one child found: the record is not consistent
    expect(() => Records.getChild({ parentNode: cluster, childDefUuid: plotDef.uuid })(record)).toThrow(
      'systemError.record.multipleNodesFound'
    )
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
