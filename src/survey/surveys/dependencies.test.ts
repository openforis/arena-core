import { UserFactory } from '../../auth'
import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders

import { SurveyDependencyType } from '../survey'

let survey: Survey

const expectDependents = (params: {
  sourceName: string
  dependencyType: SurveyDependencyType
  expectedDependentNames: string[]
}) => {
  const { sourceName, dependencyType, expectedDependentNames } = params
  const accessibleDef = Surveys.getNodeDefByName({ survey, name: sourceName })
  const dependents = Surveys.getNodeDefDependents({
    survey,
    nodeDefUuid: accessibleDef?.uuid,
    dependencyType,
  })
  const dependentNames = Object.values(dependents).map((dependent) => dependent?.props?.name)
  expect(dependentNames).toEqual(expectedDependentNames)
}

describe('Survey Dependencies', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@openforis-arena.org', name: 'test' })

    survey = new SurveyBuilder(
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
})
