import { NodeDefs } from '../../nodeDef'
import { Survey } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'

const { entityDef, integerDef } = SurveyObjectBuilders

let survey: Survey

describe('Survey Node Definitionss index', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_id').key()).multiple())
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
})
