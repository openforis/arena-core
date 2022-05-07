import { NodeDefType } from '../../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { UserFactory } from '../../../auth'
import { SurveyBuilder } from './surveyBuilder'
import { SurveyObjectBuilders } from '.'

const { entityDef, integerDef } = SurveyObjectBuilders

const expectNodeDefToExist = (params: { survey: Survey; name: string }): void => {
  const def = Surveys.getNodeDefByName(params)
  expect(def).toBeDefined()
  expect(def?.props.name).toBeDefined()
}

describe('SurveyBuilder', () => {
  test('simple survey build', () => {
    const user = UserFactory.createInstance({ email: 'test@openforis-arena.org', name: 'test' })
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
    const clusterDef = Surveys.getNodeDefByName({ survey, name: 'cluster' })
    expect(clusterDef?.parentUuid).toBeUndefined()
    expect(clusterDef?.type).toBe(NodeDefType.entity)

    // check cluster_id
    expectNodeDefToExist({ survey, name: 'cluster_id' })
    const clusterIdDef = Surveys.getNodeDefByName({ survey, name: 'cluster_id' })
    expect(clusterIdDef?.parentUuid).toBe(clusterDef?.uuid)
    expect(clusterIdDef?.type).toBe(NodeDefType.integer)
    expect(clusterIdDef?.props.multiple).toBeFalsy()
    expect(clusterIdDef?.props.key).toBeTruthy()

    // check plot
    expectNodeDefToExist({ survey, name: 'plot' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    expect(plotDef?.parentUuid).toBe(clusterDef?.uuid)
    expect(plotDef?.type).toBe(NodeDefType.entity)
    expect(plotDef?.props.multiple).toBeTruthy()

    // check plot_id
    expectNodeDefToExist({ survey, name: 'plot_id' })
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    expect(plotIdDef?.parentUuid).toBe(plotDef?.uuid)
    expect(plotIdDef?.type).toBe(NodeDefType.integer)
    expect(plotIdDef?.props.multiple).toBeFalsy()
    expect(plotIdDef?.props.key).toBeTruthy()
  })
})
