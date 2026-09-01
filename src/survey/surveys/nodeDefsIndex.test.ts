import { beforeAll, describe, test, expect } from '@jest/globals'

import { NodeDef, NodeDefs } from '../../nodeDef'
import { Survey } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { addNodeDefToIndex, deleteNodeDefIndex } from './_nodeDefs/nodeDefsIndex'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

let survey: Survey

describe('Survey Node Definitionss index', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        textDef('cluster_remarks').qualifier(),
        entityDef('plot', integerDef('plot_id').key(), textDef('plot_remarks').qualifier()).multiple()
      )
    ).build()
  }, 10000)

  test('root def UUID', () => {
    const clusterUuid = survey.nodeDefsIndex?.rootDefUuid
    expect(clusterUuid).toBeDefined()
  })

  test('node defs by name', () => {
    const { nodeDefUuidByName, rootDefUuid } = survey.nodeDefsIndex ?? {}
    const clusterUuid2 = nodeDefUuidByName?.['cluster']
    expect(rootDefUuid).toBe(clusterUuid2)

    // cluster_id
    const clusterIdUuid = nodeDefUuidByName?.['cluster_id']
    expect(clusterIdUuid).toBeDefined()
    expect(clusterIdUuid).not.toBe(rootDefUuid)

    const clusterIdDef = survey.nodeDefs?.[clusterIdUuid!]
    expect(clusterIdDef).toBeDefined()
    expect(NodeDefs.getName(clusterIdDef!)).toBe('cluster_id')

    // plot_id
    const plotIdUuid = nodeDefUuidByName?.['plot_id']
    expect(plotIdUuid).toBeDefined()
    expect(plotIdUuid).not.toBe(rootDefUuid)

    const plotIdDef = survey.nodeDefs?.[plotIdUuid!]
    expect(plotIdDef).toBeDefined()
    expect(NodeDefs.getName(plotIdDef!)).toBe('plot_id')
  })

  test('qualifier node defs by uuid', () => {
    const { nodeDefUuidByName, qualifierPresenceByUuid } = survey.nodeDefsIndex ?? {}

    const clusterRemarksUuid = nodeDefUuidByName?.['cluster_remarks']
    const plotRemarksUuid = nodeDefUuidByName?.['plot_remarks']
    expect(clusterRemarksUuid).toBeDefined()
    expect(plotRemarksUuid).toBeDefined()

    // qualifier attributes are indexed
    expect(qualifierPresenceByUuid?.[clusterRemarksUuid!]).toBe(true)
    expect(qualifierPresenceByUuid?.[plotRemarksUuid!]).toBe(true)

    // non-qualifier attributes are not indexed
    const clusterIdUuid = nodeDefUuidByName?.['cluster_id']
    const plotIdUuid = nodeDefUuidByName?.['plot_id']
    expect(qualifierPresenceByUuid?.[clusterIdUuid!]).toBeUndefined()
    expect(qualifierPresenceByUuid?.[plotIdUuid!]).toBeUndefined()
  })

  test('deleteNodeDefIndex and addNodeDefToIndex update the qualifier index', () => {
    const clusterRemarksUuid = survey.nodeDefsIndex?.nodeDefUuidByName?.['cluster_remarks']!
    const clusterRemarksDef: NodeDef<any> = survey.nodeDefs![clusterRemarksUuid]

    const surveyWithoutQualifier = deleteNodeDefIndex(clusterRemarksDef)(survey)
    expect(surveyWithoutQualifier.nodeDefsIndex?.qualifierPresenceByUuid?.[clusterRemarksUuid]).toBeUndefined()
    // original survey is not mutated
    expect(survey.nodeDefsIndex?.qualifierPresenceByUuid?.[clusterRemarksUuid]).toBe(true)

    const surveyWithQualifierReAdded = addNodeDefToIndex(clusterRemarksDef, { sideEffect: false })(
      surveyWithoutQualifier
    )
    expect(surveyWithQualifierReAdded.nodeDefsIndex?.qualifierPresenceByUuid?.[clusterRemarksUuid]).toBe(true)
  })
})
