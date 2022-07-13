import { SurveyObj } from './surveyObj'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders

let survey: SurveyObj

describe('Survey Object', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    const surveyJson = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key().defaultValue('1').validationExpressions('cluster_id > 0 && cluster_id <= 1000'),
        booleanDef('accessible'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          integerDef('plot_id_double').readOnly().defaultValue('plot_id * 2')
        )
          .multiple()
          .applyIf('accessible')
      )
    ).build()
    survey = new SurveyObj(surveyJson)
  }, 10000)

  test('Root entity def', () => {
    expect(survey.root).not.toBeUndefined()
    expect(survey.root.props?.name).toBe('cluster')
  })

  test('Node def children', () => {
    const children = survey.root.getChildren()
    expect(children.length).toBe(3)
    expect(children.map((child) => child.props.name)).toEqual(['cluster_id', 'accessible', 'plot'])
  })

  test('Get node def by name', () => {
    const plotDef = survey.getNodeDefByName('plot')
    expect(plotDef).not.toBeUndefined()
    expect(plotDef?.props?.name).toBe('plot')
  })

  test('Get parent', () => {
    const plotDef = survey.getNodeDefByName('plot')
    const plotIdDef = survey.getNodeDefByName('plot_id')
    expect(plotIdDef?.parent).not.toBeUndefined()
    expect(plotIdDef?.parentUuid).toBe(plotDef?.uuid)
  })
})
