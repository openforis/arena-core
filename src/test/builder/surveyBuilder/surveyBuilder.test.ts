import { NodeDef, NodeDefProps, NodeDefType } from '../../../nodeDef'
import { Survey } from '../../../survey'
import { entityDef, integerDef } from '.'
import { UserFactory } from '../../../auth'
import { SurveyBuilder } from './surveyBuilder'

const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> | undefined =>
  Object.values(params.survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === params.name)

const expectNodeDefToExist = (params: { survey: Survey; name: string }): void => {
  const def = getNodeDefByName(params)
  expect(def).toBeDefined()
  expect(def?.props.name).toBeDefined()
}

describe('SurveyBuilder', () => {
  test('simple survey build', () => {
    const user = UserFactory.createInstance({
      email: 'test@arena.org',
      name: 'test',
    })
    const survey: Survey = new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_id').key()).multiple())
    ).build()

    expect(survey).toBeDefined()
    expect(survey.nodeDefs).toBeDefined()

    const nodeDefs = survey.nodeDefs || {}
    expect(Object.entries(nodeDefs).length).toBe(4)

    // check cluster
    expectNodeDefToExist({ survey, name: 'cluster' })
    const clusterDef = getNodeDefByName({ survey, name: 'cluster' })
    expect(clusterDef?.parentUuid).toBeUndefined()
    expect(clusterDef?.type).toBe(NodeDefType.entity)

    // check cluster_id
    expectNodeDefToExist({ survey, name: 'cluster_id' })
    const clusterIdDef = getNodeDefByName({ survey, name: 'cluster_id' })
    expect(clusterIdDef?.parentUuid).toBe(clusterDef?.uuid)
    expect(clusterIdDef?.type).toBe(NodeDefType.integer)
    expect(clusterIdDef?.props.multiple).toBeFalsy()
    expect(clusterIdDef?.props.key).toBeTruthy()

    // check plot
    expectNodeDefToExist({ survey, name: 'plot' })
    const plotDef = getNodeDefByName({ survey, name: 'plot' })
    expect(plotDef?.parentUuid).toBe(clusterDef?.uuid)
    expect(plotDef?.type).toBe(NodeDefType.entity)
    expect(plotDef?.props.multiple).toBeTruthy()

    // check plot_id
    expectNodeDefToExist({ survey, name: 'plot_id' })
    const plotIdDef = getNodeDefByName({ survey, name: 'plot_id' })
    expect(plotIdDef?.parentUuid).toBe(plotDef?.uuid)
    expect(plotIdDef?.type).toBe(NodeDefType.integer)
    expect(plotIdDef?.props.multiple).toBeFalsy()
    expect(plotIdDef?.props.key).toBeTruthy()
  })
})
