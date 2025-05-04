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
})
