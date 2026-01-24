import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders

import { SurveyDependencyType } from '../survey'

let survey: Survey

const expectDependents = (params: {
  sourceName: string
  dependencyType: SurveyDependencyType
  expectedDependentNames: string[]
}) => {
  const { sourceName, dependencyType, expectedDependentNames } = params
  const sourceDef = Surveys.getNodeDefByName({ survey, name: sourceName })
  const dependentDefs = Surveys.getNodeDefDependents({
    survey,
    nodeDefUuid: sourceDef?.uuid,
    dependencyType,
  })
  const dependentNames = dependentDefs.map((dependentDef) => dependentDef?.props?.name)
  expect(dependentNames).toEqual(expectedDependentNames)
}

describe('Survey Dependencies', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key().defaultValue('1').validationExpressions('cluster_id > 0 && cluster_id <= 1000'),
        booleanDef('accessible'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          integerDef('plot_id_double').readOnly().defaultValue('plot_id * 2'),
          integerDef('plot_index').readOnly().defaultValue('index($context)').defaultValueEvaluatedOnlyOneTime()
        )
          .multiple()
          .applyIf('accessible'),
        integerDef('plot_count').readOnly().defaultValue('plot.length')
      )
    ).build()
  }, 10000)

  test('Default values dependency (empty - constant value)', () => {
    expectDependents({
      sourceName: 'cluster_id',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: [],
    })
  })

  test('Default values dependency (empty - not specified)', () => {
    expectDependents({
      sourceName: 'accessible',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: [],
    })
  })

  test('Default values dependency (readOnly attribute)', () => {
    expectDependents({
      sourceName: 'plot_id',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: ['plot_id_double'],
    })
  })

  test('Default values dependency ($context)', () => {
    expectDependents({
      sourceName: 'plot',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: ['plot_index', 'plot_count'],
    })
  })

  test('Apply if dependency', () => {
    expectDependents({
      sourceName: 'accessible',
      dependencyType: SurveyDependencyType.applicable,
      expectedDependentNames: ['plot'],
    })
  })

  test('Validation expression dependency', () => {
    expectDependents({
      sourceName: 'cluster_id',
      dependencyType: SurveyDependencyType.validations,
      expectedDependentNames: ['cluster_id'],
    })
  })

  test('Dependencies remove (applicability dependency)', () => {
    const surveyOld = survey

    const nodeDefName = 'plot'
    const nodeDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
    const nodeDefUuid = nodeDef.uuid

    survey = Surveys.removeNodeDefDependencies({ survey, nodeDefUuid })

    const dependentDefs = Surveys.getNodeDefDependents({ survey, nodeDefUuid })
    expect(dependentDefs).toEqual([])

    expectDependents({
      sourceName: 'accessible',
      dependencyType: SurveyDependencyType.applicable,
      expectedDependentNames: [],
    })

    survey = surveyOld
  })

  test('Dependencies remove (default value dependency)', () => {
    const surveyOld = survey

    const nodeDefName = 'plot_id_double'
    const nodeDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
    const nodeDefUuid = nodeDef.uuid

    survey = Surveys.removeNodeDefDependencies({ survey, nodeDefUuid })

    const dependentDefs = Surveys.getNodeDefDependents({ survey, nodeDefUuid })
    expect(dependentDefs).toEqual([])

    expectDependents({
      sourceName: 'plot_id',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: [],
    })

    survey = surveyOld
  })

  test('Dependencies remove (other dependent node defs not affected by deletion)', () => {
    const surveyOld = survey

    const nodeDefName = 'accessible'
    const nodeDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
    const nodeDefUuid = nodeDef.uuid

    survey = Surveys.removeNodeDefDependencies({ survey, nodeDefUuid })

    const dependentDefs = Surveys.getNodeDefDependents({ survey, nodeDefUuid })
    expect(dependentDefs).toEqual([])

    expectDependents({
      sourceName: 'plot_id',
      dependencyType: SurveyDependencyType.defaultValues,
      expectedDependentNames: ['plot_id_double'],
    })

    survey = surveyOld
  })

  test('Dependent node paths are calculated from source to dependent', () => {
    // Test path from plot_id to plot_id_double (both in same entity 'plot')
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const dependencyGraph = survey.dependencyGraph
    const dependentPaths = dependencyGraph?.[SurveyDependencyType.defaultValues]?.nodePaths?.[plotIdDef.uuid]

    // The path from plot_id to plot_id_double should be just 'plot_id_double' (sibling)
    expect(dependentPaths).toContain('plot_id_double')

    // Test path from plot entity to its dependents
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const dependentPathsFromPlot = dependencyGraph?.[SurveyDependencyType.defaultValues]?.nodePaths?.[plotDef.uuid]

    // The plot entity has two dependents:
    // 1. plot_index (child of plot, references $context which is the plot entity)
    //    - path should be 'plot.plot_index' (go into plot entity, then to plot_index)
    // 2. plot_count (sibling of plot, references plot.length) - path is just 'plot_count'
    expect(dependentPathsFromPlot).toContain('plot.plot_index')
    expect(dependentPathsFromPlot).toContain('plot_count')

    // Test a more complex case: accessible -> plot entity (applyIf dependency)
    const accessibleDef = Surveys.getNodeDefByName({ survey, name: 'accessible' })
    const dependentPathsFromAccessible =
      dependencyGraph?.[SurveyDependencyType.applicable]?.nodePaths?.[accessibleDef.uuid]

    // From accessible to plot (both siblings), path should be just 'plot'
    expect(dependentPathsFromAccessible).toContain('plot')
  })

  test('Dependent node paths with parent() references for deeper hierarchies', async () => {
    const user = createTestAdminUser()

    // Create a survey with deeper nesting to test path calculation
    const testSurvey = await new SurveyBuilder(
      user,
      entityDef(
        'root',
        integerDef('root_value').key(),
        entityDef(
          'level1',
          integerDef('level1_value'),
          entityDef(
            'level2',
            integerDef('level2_value'),
            // This references root_value from 2 levels up
            integerDef('computed').readOnly().defaultValue('root_value * 2')
          ).multiple()
        ).multiple()
      )
    ).build()

    const dependencyGraph = testSurvey.dependencyGraph
    const rootValueDef = Surveys.getNodeDefByName({ survey: testSurvey, name: 'root_value' })
    const dependentPaths = dependencyGraph?.[SurveyDependencyType.defaultValues]?.nodePaths?.[rootValueDef.uuid]
    // the path should be: level1.level2.computed
    expect(dependentPaths).toContain('level1.level2.computed')
  }, 10000)
})
