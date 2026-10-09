import { beforeAll, describe, expect, test } from '@jest/globals'

import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

let survey: Survey

describe('Surveys.getNodeDefAncestorMultipleEntity', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      createTestAdminUser(),
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        textDef('cluster_notes').multiple(),
        entityDef('cluster_info', textDef('info_notes').multiple()),
        entityDef('plot', integerDef('plot_id').key(), textDef('plot_notes').multiple()).multiple()
      )
    ).build()
  })

  test.each([
    ['cluster_id', 'cluster'],
    ['plot_id', 'plot'],
    // multiple attributes: the attribute itself is not an ancestor
    ['cluster_notes', 'cluster'],
    ['plot_notes', 'plot'],
    // multiple attribute inside a single entity
    ['info_notes', 'cluster'],
    // multiple entity: its ancestor multiple entity is the parent one
    ['plot', 'cluster'],
  ])('%s => %s', (nodeDefName, expectedAncestorName) => {
    const nodeDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
    const ancestor = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef })
    expect(ancestor?.props.name).toBe(expectedAncestorName)
  })

  test('root entity has no ancestors', () => {
    const rootDef = Surveys.getNodeDefRoot({ survey })
    expect(Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef: rootDef })).toBeUndefined()
  })
})
