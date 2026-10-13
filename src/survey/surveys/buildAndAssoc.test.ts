import { beforeAll, describe, expect, test } from '@jest/globals'

import { Survey, SurveyDependencyType, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'

const { entityDef, integerDef } = SurveyObjectBuilders

// survey without node defs index and dependency graph
let surveyNotIndexed: Survey

describe('Surveys build and assoc functions return a copy of the survey', () => {
  beforeAll(async () => {
    const survey = await new SurveyBuilder(
      createTestAdminUser(),
      entityDef('cluster', integerDef('cluster_id').key(), integerDef('cluster_calc').defaultValue('cluster_id + 1'))
    ).build()
    const { nodeDefsIndex: _index, dependencyGraph: _graph, ...surveyWithoutIndexes } = survey
    surveyNotIndexed = surveyWithoutIndexes
  }, 10000)

  test('buildAndAssocNodeDefsIndex', () => {
    const surveyIndexed = Surveys.buildAndAssocNodeDefsIndex(surveyNotIndexed)

    expect(surveyIndexed).not.toBe(surveyNotIndexed)
    expect(surveyNotIndexed.nodeDefsIndex).toBeUndefined()
    const clusterIdDef = Surveys.getNodeDefByName({ survey: surveyIndexed, name: 'cluster_id' })
    expect(surveyIndexed.nodeDefsIndex?.nodeDefUuidByName?.['cluster_id']).toBe(clusterIdDef.uuid)
    expect(surveyIndexed.nodeDefsIndex?.rootDefUuid).toBe(Surveys.getNodeDefRoot({ survey: surveyIndexed }).uuid)
  })

  test('buildAndAssocDependencyGraph', async () => {
    const surveyWithGraph = await Surveys.buildAndAssocDependencyGraph(surveyNotIndexed)

    expect(surveyWithGraph).not.toBe(surveyNotIndexed)
    expect(surveyNotIndexed.dependencyGraph).toBeUndefined()
    const clusterIdDef = Surveys.getNodeDefByName({ survey: surveyWithGraph, name: 'cluster_id' })
    const dependentNames = Surveys.getNodeDefDependents({
      survey: surveyWithGraph,
      nodeDefUuid: clusterIdDef.uuid,
      dependencyType: SurveyDependencyType.defaultValues,
    }).map((nodeDef) => nodeDef.props.name)
    expect(dependentNames).toEqual(['cluster_calc'])
  })

  test('building the dependency graph again does not change the previous one', async () => {
    const surveyWithGraph = await Surveys.buildAndAssocDependencyGraph(surveyNotIndexed)
    const graph = surveyWithGraph.dependencyGraph
    const graphJson = JSON.stringify(graph)

    const surveyWithGraph2 = await Surveys.buildAndAssocDependencyGraph(surveyWithGraph)

    expect(surveyWithGraph2.dependencyGraph).not.toBe(graph)
    expect(JSON.stringify(surveyWithGraph.dependencyGraph)).toBe(graphJson)
  })
})
